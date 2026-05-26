import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { GenerateQuestsBody } from "../validation.js";
import {
  AIQuestGenerationError,
  generateDailyQuests,
  type GeneratedQuestsResponse,
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

/**
 * POST /api/ai/generate-quests
 *
 * Generates personalized daily quests using AI based on user profile
 * and past performance. Persists the generated batch to DailyQuestLog
 * for analytics and deduplication. Returns strict JSON.
 */
router.post("/ai/generate-quests", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = GenerateQuestsBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid input",
      details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    });
    return;
  }

  try {
    // Enrich with real user data from DB
    const user = await User.findOne({ id: req.userId! }).lean();
    const enrichedInput = { ...parsed.data };

    if (user) {
      enrichedInput.pastPerformance = {
        streak: user.streak ?? enrichedInput.pastPerformance.streak,
        completionRate: enrichedInput.pastPerformance.completionRate,
        recentMissedTasks: enrichedInput.pastPerformance.recentMissedTasks,
      };
    }

    const { quests, summary, model } = await generateDailyQuests(enrichedInput);

    // Persist the generated batch to MongoDB for history/analytics
    await DailyQuestLog.create({
      userId: req.userId!,
      model,
      input: enrichedInput,
      quests,
      summary,
      accepted: false,
    });

    // Return strict JSON — no extra fields
    const response: GeneratedQuestsResponse = { quests, summary };
    res.json(response);
  } catch (err: unknown) {
    if (err instanceof AIQuestGenerationError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }

    if (err instanceof Error && err.message.includes("API_KEY")) {
      res.status(503).json({ error: "AI service not configured. Please set GOOGLE_AI_API_KEY." });
      return;
    }

    req.log.error({ err }, "AI quest generation error");
    res.status(500).json({ error: "Failed to generate quests. Please try again." });
  }
});

/**
 * POST /api/ai/accept-quests
 *
 * Accepts AI-generated quests and saves them to the database as real quests.
 * Also marks the most recent DailyQuestLog as accepted.
 */
router.post("/ai/accept-quests", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { quests } = req.body;

  if (!Array.isArray(quests) || quests.length === 0 || quests.length > 6) {
    res.status(400).json({ error: "Must provide 1–6 quests to accept" });
    return;
  }

  try {
    const created = [];

    for (const quest of quests) {
      const title = String(quest.title || "").trim();
      const difficulty = ["easy", "medium", "hard"].includes(quest.difficulty)
        ? quest.difficulty
        : "medium";
      const category = ["strength", "intelligence", "discipline", "health"].includes(quest.category)
        ? quest.category
        : "discipline";
      const xpReward = XP_REWARDS[difficulty] ?? 100;

      if (!title) continue;

      const id = await getNextSequence("quests");
      const newQuest = await Quest.create({
        id,
        userId: req.userId!,
        title,
        description: `AI-generated ${difficulty} quest • ${quest.duration || 30} min`,
        difficulty,
        category,
        xpReward,
        status: "available",
        completed: false,
        completedAt: null,
      });

      created.push({
        id: newQuest.id,
        title: newQuest.title,
        description: newQuest.description,
        difficulty: newQuest.difficulty,
        category: newQuest.category,
        xpReward: newQuest.xpReward,
        completed: false,
      });
    }

    // Mark the most recent quest log as accepted
    await DailyQuestLog.findOneAndUpdate(
      { userId: req.userId!, accepted: false },
      { $set: { accepted: true, acceptedAt: new Date() } },
      { sort: { generatedAt: -1 } },
    );

    res.status(201).json({
      accepted: created.length,
      quests: created,
    });
  } catch (err) {
    req.log.error({ err }, "Accept AI quests error");
    res.status(500).json({ error: "Failed to save quests" });
  }
});

/**
 * GET /api/ai/quest-history
 *
 * Returns the user's last 10 AI quest generation logs.
 */
router.get("/ai/quest-history", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const logs = await DailyQuestLog.find({ userId: req.userId! })
      .sort({ generatedAt: -1 })
      .limit(10)
      .lean();

    res.json(
      logs.map((log) => ({
        generatedAt: log.generatedAt,
        model: log.model,
        questCount: log.quests.length,
        quests: log.quests,
        summary: log.summary,
        accepted: log.accepted,
        acceptedAt: log.acceptedAt,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Quest history error");
    res.status(500).json({ error: "Failed to fetch quest history" });
  }
});

export default router;
