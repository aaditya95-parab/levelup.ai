import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { CreateQuestBody, UpdateQuestBody, UpdateQuestParams, GetQuestsQueryParams } from "../validation.js";
import { getNextSequence } from "../models/counter.js";
import { Quest, type QuestDocument } from "../models/quest.js";
import { User, type UserDocument } from "../models/user.js";

const router = Router();

const XP_REWARDS: Record<string, number> = {
  easy: 50,
  medium: 100,
  hard: 200,
};

type StatKey = "strength" | "intelligence" | "discipline" | "health";

const STAT_MAP: Record<string, StatKey> = {
  strength: "strength",
  intelligence: "intelligence",
  discipline: "discipline",
  health: "health",
};

function xpToNextLevel(level: number): number {
  return 100 * level;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]!;
}

function toQuestResponse(quest: QuestDocument) {
  return {
    id: quest.id,
    userId: quest.userId,
    title: quest.title,
    description: quest.description ?? null,
    difficulty: quest.difficulty,
    category: quest.category,
    xpReward: quest.xpReward,
    status: quest.status,
    completed: quest.completed,
    completedAt: quest.completedAt ?? null,
    createdAt: quest.createdAt,
  };
}

function toUserProfile(user: UserDocument) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    level: user.level,
    xp: user.xp,
    xpToNextLevel: xpToNextLevel(user.level),
    streak: user.streak,
    stats: user.stats,
    createdAt: user.createdAt,
  };
}

router.get("/quests", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = GetQuestsQueryParams.safeParse(req.query);
  const completedFilter = parsed.success ? parsed.data.completed : undefined;
  const statusFilter = parsed.success ? parsed.data.status : undefined;

  try {
    // ── FALLBACK MIGRATION LOGIC FOR LEGACY QUESTS ──
    // 1. User ownership consistency: tie old quests to this authenticated user
    await Quest.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId: req.userId! } }
    );
    // 2. Status migration: derive from completed boolean
    await Quest.updateMany(
      { status: { $exists: false }, completed: true },
      { $set: { status: "completed" } }
    );
    await Quest.updateMany(
      { status: { $exists: false }, completed: false },
      { $set: { status: "available" } }
    );

    const filter: Record<string, unknown> = { userId: req.userId! };

    // Status filter takes priority over completed filter
    if (statusFilter !== undefined) {
      filter.status = statusFilter;
    } else if (completedFilter !== undefined) {
      filter.completed = completedFilter;
    }

    const quests = await Quest.find(filter).sort({ createdAt: 1 }).lean();

    res.json(quests.map((quest) => toQuestResponse(quest as QuestDocument)));
  } catch (err) {
    req.log.error({ err }, "Get quests error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quests", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = CreateQuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { title, description, difficulty, category } = parsed.data;
  const xpReward = XP_REWARDS[difficulty] ?? 50;

  try {
    const id = await getNextSequence("quests");
    const quest = await Quest.create({
      id,
      userId: req.userId!,
      title,
      description: description ?? null,
      difficulty,
      category,
      xpReward,
      status: "available",
      completed: false,
      completedAt: null,
    });

    res.status(201).json(toQuestResponse(quest.toObject() as QuestDocument));
  } catch (err) {
    req.log.error({ err }, "Create quest error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/quests/:questId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const paramsParsed = UpdateQuestParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid quest ID" });
    return;
  }

  const bodyParsed = UpdateQuestBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { questId } = paramsParsed.data;
  const { completed, status, title, description, difficulty, category } = bodyParsed.data;

  try {
    const existing = await Quest.findOne({ id: questId, userId: req.userId! }).lean();

    if (!existing) {
      res.status(404).json({ error: "Quest not found" });
      return;
    }

    const updateValues: Partial<QuestDocument> = {};
    if (title !== undefined) updateValues.title = title;
    if (description !== undefined) updateValues.description = description;
    if (difficulty !== undefined) {
      updateValues.difficulty = difficulty;
      updateValues.xpReward = XP_REWARDS[difficulty] ?? existing.xpReward;
    }
    if (category !== undefined) updateValues.category = category;

    // Handle status changes (e.g., accepting a quest)
    if (status !== undefined) {
      updateValues.status = status as any;
      // If setting to completed via status field, also set completed boolean
      if (status === "completed" && !existing.completed) {
        updateValues.completed = true;
        updateValues.completedAt = new Date();
      }
      // If reverting from completed, reset completed boolean
      if (status !== "completed" && existing.completed) {
        updateValues.completed = false;
        updateValues.completedAt = null;
      }
    }

    let xpGained = 0;
    let leveledUp = false;
    let newLevel: number | null = null;
    let streakUpdated = false;

    if ((completed === true || status === "completed") && !existing.completed) {
      updateValues.completed = true;
      updateValues.completedAt = new Date();
      updateValues.status = "completed";
      xpGained = existing.xpReward;

      // Update user stats
      const user = await User.findOne({ id: req.userId! }).lean();

      if (user) {
        let newXp = user.xp + xpGained;
        let currentLevel = user.level;
        let didLevelUp = false;

        // Level up loop
        while (newXp >= xpToNextLevel(currentLevel)) {
          newXp -= xpToNextLevel(currentLevel);
          currentLevel++;
          didLevelUp = true;
        }

        // Update stats
        const statKey = STAT_MAP[existing.category];
        const updatedStats = { ...user.stats };
        if (statKey) {
          updatedStats[statKey] = (updatedStats[statKey] ?? 0) + 1;
        }

        // Update streak
        const today = getTodayDate();
        let newStreak = user.streak;
        let didStreakUpdate = false;

        if (user.lastActiveDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0]!;

          if (user.lastActiveDate === yesterdayStr) {
            newStreak = user.streak + 1;
          } else {
            newStreak = 1;
          }
          didStreakUpdate = true;
        }

        const longestStreak = Math.max(user.longestStreak, newStreak);

        await User.updateOne(
          { id: req.userId! },
          {
            $set: {
              xp: newXp,
              level: currentLevel,
              stats: updatedStats,
              streak: newStreak,
              longestStreak,
              lastActiveDate: today,
            },
          },
        );

        if (didLevelUp) {
          leveledUp = true;
          newLevel = currentLevel;
        }
        streakUpdated = didStreakUpdate;
      }
    } else if ((completed === false || status === "available") && existing.completed) {
      updateValues.completed = false;
      updateValues.completedAt = null;
      updateValues.status = "available";
    }

    const updatedQuest = await Quest.findOneAndUpdate(
      { id: questId, userId: req.userId! },
      { $set: updateValues },
      { new: true },
    ).lean();

    const updatedUser = await User.findOne({ id: req.userId! }).lean();

    res.json({
      quest: updatedQuest ? toQuestResponse(updatedQuest as QuestDocument) : null,
      user: updatedUser ? toUserProfile(updatedUser as UserDocument) : null,
      xpGained,
      leveledUp,
      newLevel,
      streakUpdated,
    });
  } catch (err) {
    req.log.error({ err }, "Update quest error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quests/:questId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const paramsParsed = UpdateQuestParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid quest ID" });
    return;
  }

  const { questId } = paramsParsed.data;

  try {
    const existing = await Quest.findOne({ id: questId, userId: req.userId! }).lean();

    if (!existing) {
      res.status(404).json({ error: "Quest not found" });
      return;
    }

    await Quest.deleteOne({ id: questId, userId: req.userId! });

    res.json({ success: true, message: "Quest deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete quest error");
    res.status(500).json({ error: "Internal server error" });
  }
});

import { generateOnboardingQuests } from "../lib/ai-quest-generator.js";

router.post("/quests/generate", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findOne({ id: req.userId! }).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.profile) {
      res.status(400).json({ error: "Onboarding profile incomplete. Cannot generate quests." });
      return;
    }

    let quests: any[] = [];
    let summary = "Welcome! Your quests have been prepared. Let the grind begin.";
    let aiModel = "none";

    try {
      // Use the onboarding quest generator as the daily quest generator
      const result = await generateOnboardingQuests(user.profile);
      quests = result.quests;
      summary = result.summary;
      aiModel = result.model;
    } catch (aiErr) {
      req.log.warn({ aiErr }, "AI quest generation failed — providing fallback quests");
      quests = [
        { title: "Complete the Life Setup Walkthrough", difficulty: "easy", duration: 15, category: "discipline" },
        { title: "Drink a glass of water", difficulty: "easy", duration: 5, category: "health" },
        { title: "Review your chosen goals", difficulty: "medium", duration: 20, category: "intelligence" }
      ];
      summary = "AI API Key missing or invalid. Backup basic quests have been loaded instead.";
    }

    const savedQuests = [];
    for (const quest of quests) {
      const { title, difficulty, category } = quest;
      const xpReward = XP_REWARDS[difficulty] ?? 50;

      const id = await getNextSequence("quests");
      const newQuest = await Quest.create({
        id,
        userId: req.userId!,
        title,
        description: `Daily quest • ${difficulty} • ${quest.duration || 15} min`,
        difficulty,
        category,
        xpReward,
        completed: false,
        completedAt: null,
      });

      savedQuests.push(toQuestResponse(newQuest.toObject() as QuestDocument));
    }

    res.status(201).json({
      success: true,
      summary,
      model: aiModel,
      quests: savedQuests,
    });
  } catch (err) {
    req.log.error({ err }, "Generate quests error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
