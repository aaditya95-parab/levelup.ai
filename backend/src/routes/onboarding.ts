import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { OnboardingProfileBody } from "../validation.js";
import {
  AIQuestGenerationError,
  generateOnboardingQuests,
  type OnboardingProfile,
} from "../lib/ai-quest-generator.js";
import { getNextSequence } from "../models/counter.js";
import { Quest } from "../models/quest.js";
import { User } from "../models/user.js";
import { DailyQuestLog } from "../models/daily-quest-log.js";

const router = Router();

const XP_REWARDS: Record<string, number> = {
  easy: 50,
  medium: 100,
  hard: 200,
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function calcFreeMinutes(schedule: {
  wakeUpTime: string;
  sleepTime: string;
  workStart: string | null;
  workEnd: string | null;
  commuteMinutes: number;
}): number {
  const wake = timeToMinutes(schedule.wakeUpTime);
  const sleep = timeToMinutes(schedule.sleepTime);
  const awakeMinutes = sleep > wake ? sleep - wake : 24 * 60 - wake + sleep;

  let busyMinutes = schedule.commuteMinutes;
  if (schedule.workStart && schedule.workEnd) {
    const ws = timeToMinutes(schedule.workStart);
    const we = timeToMinutes(schedule.workEnd);
    busyMinutes += we > ws ? we - ws : 0;
  }

  return Math.max(20, Math.min(awakeMinutes - busyMinutes - 90, 480));
}

// ─── GET /api/onboarding/status ───────────────────────────────────────────────

router.get("/onboarding/status", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findOne({ id: req.userId! }).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ onboardingComplete: user.onboardingComplete ?? false });
  } catch (err) {
    req.log.error({ err }, "Onboarding status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/onboarding/profile ─────────────────────────────────────────────

router.get("/onboarding/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findOne({ id: req.userId! }).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ profile: user.profile ?? null, onboardingComplete: user.onboardingComplete ?? false });
  } catch (err) {
    req.log.error({ err }, "Get onboarding profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/onboarding/profile ────────────────────────────────────────────
/**
 * Saves all 5 onboarding sections, generates first-day AI quests,
 * auto-accepts them into Quest collection, and marks onboarding complete.
 */
router.post("/onboarding/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = OnboardingProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid input",
      details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    });
    return;
  }

  const data = parsed.data;
  const freeTimeMinutes = calcFreeMinutes(data.schedule);

  const profileToSave = {
    name: data.name,
    age: data.age,
    height: data.height,
    weight: data.weight,
    goals: data.goals,
    schedule: {
      ...data.schedule,
      freeTimeMinutes,
    },
    skillLevels: data.skillLevels,
    personality: data.personality,
  };

  try {
    // 1. Save profile + mark onboarding complete
    await User.updateOne(
      { id: req.userId! },
      { $set: { profile: profileToSave, onboardingComplete: true } },
    );

    // 2. Generate first-day quests via AI
    const onboardingProfile: OnboardingProfile = {
      ...data,
      schedule: { ...data.schedule, freeTimeMinutes },
    };

    let quests: any[] = [];
    let summary = "Welcome! Your first quests have been prepared. Let the grind begin.";
    let aiModel = "none";

    try {
      const result = await generateOnboardingQuests(onboardingProfile);
      quests = result.quests;
      summary = result.summary;
      aiModel = result.model;

      // 3. Persist generation log
      await DailyQuestLog.create({
        userId: req.userId!,
        model: aiModel,
        input: {
          goals: onboardingProfile.goals,
          level: "beginner",
          dailyTime: freeTimeMinutes,
          weaknesses: [],
          preferredTime: data.personality.chronotype === "morning" ? "morning" : "night",
          pastPerformance: { streak: 0, completionRate: 50, recentMissedTasks: 0 },
        },
        quests,
        summary,
        accepted: true,
        acceptedAt: new Date(),
      });
    } catch (aiErr) {
      // AI failure is non-fatal — provide fallback quests
      req.log.warn({ aiErr }, "AI quest generation failed during onboarding — providing fallback quests");
      quests = [
        {
          title: "Complete the Life Setup Walkthrough",
          difficulty: "easy",
          duration: 15,
          category: "discipline"
        },
        {
          title: "Drink a glass of water",
          difficulty: "easy",
          duration: 5,
          category: "health"
        },
        {
          title: "Review your chosen goals",
          difficulty: "medium",
          duration: 20,
          category: "intelligence"
        }
      ];
      summary = "AI API Key missing or invalid. Backup basic quests have been loaded instead.";
    }

    // 4. Save quests to Quest collection
    const savedQuests = [];
    for (const quest of quests) {
      const title = String(quest.title || "").trim();
      if (!title) continue;

      const difficulty = ["easy", "medium", "hard"].includes(quest.difficulty)
        ? quest.difficulty
        : "medium";
      const category = ["strength", "intelligence", "discipline", "health"].includes(quest.category)
        ? quest.category
        : "discipline";
      const xpReward = XP_REWARDS[difficulty] ?? 100;

      const id = await getNextSequence("quests");
      const newQuest = await Quest.create({
        id,
        userId: req.userId!,
        title,
        description: `Day 1 quest • ${difficulty} • ${quest.duration || 30} min`,
        difficulty,
        category,
        xpReward,
        completed: false,
        completedAt: null,
      });

      savedQuests.push({
        id: newQuest.id,
        title: newQuest.title,
        description: newQuest.description,
        difficulty: newQuest.difficulty,
        category: newQuest.category,
        xpReward: newQuest.xpReward,
        completed: false,
      });
    }

    res.status(201).json({
      profile: profileToSave,
      freeTimeMinutes,
      quests: savedQuests,
      summary,
      onboardingComplete: true,
    });
  } catch (err) {
    req.log.error({ err }, "Onboarding profile save error");
    res.status(500).json({ error: "Failed to save profile. Please try again." });
  }
});

export default router;
