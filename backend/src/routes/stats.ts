import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { Quest } from "../models/quest.js";
import { User } from "../models/user.js";

const router = Router();

function xpToNextLevel(level: number): number {
  return 100 * level;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]!;
}

router.get("/stats/summary", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findOne({ id: req.userId! }).lean();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [totalCompleted, totalPending] = await Promise.all([
      Quest.countDocuments({ userId: req.userId!, completed: true }),
      Quest.countDocuments({ userId: req.userId!, completed: false }),
    ]);

    const today = getTodayDate();
    const startOfDay = new Date(`${today}T00:00:00.000Z`);
    const endOfDay = new Date(`${today}T23:59:59.999Z`);
    const questsCompletedToday = await Quest.countDocuments({
      userId: req.userId!,
      completed: true,
      completedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const needed = xpToNextLevel(user.level);
    const xpProgress = Math.min(100, Math.round((user.xp / needed) * 100));

    // Estimate total XP earned from completed quests
    const [totalXpResult] = await Quest.aggregate([
      { $match: { userId: req.userId!, completed: true } },
      { $group: { _id: null, total: { $sum: "$xpReward" } } },
    ]);

    const totalXpEarned = Number(totalXpResult?.total ?? 0);

    res.json({
      totalQuestsCompleted: totalCompleted,
      totalQuestsPending: totalPending,
      currentStreak: user.streak,
      longestStreak: user.longestStreak,
      xpToNextLevel: needed - user.xp,
      xpProgress,
      totalXpEarned,
      questsCompletedToday,
    });
  } catch (err) {
    req.log.error({ err }, "Get stats summary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/weekly", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const results = await Promise.all(
      days.map(async (day) => {
        const dateStr = day.toISOString().split("T")[0]!;
        const dayLabel = day.toLocaleDateString("en-US", { weekday: "short" });
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        const [xpResult] = await Quest.aggregate([
          {
            $match: {
              userId: req.userId!,
              completed: true,
              completedAt: { $gte: startOfDay, $lte: endOfDay },
            },
          },
          { $group: { _id: null, total: { $sum: "$xpReward" } } },
        ]);

        const questsCompleted = await Quest.countDocuments({
          userId: req.userId!,
          completed: true,
          completedAt: { $gte: startOfDay, $lte: endOfDay },
        });

        return {
          date: dateStr,
          xpEarned: Number(xpResult?.total ?? 0),
          questsCompleted,
          dayLabel,
        };
      }),
    );

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Get weekly stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/leaderboard", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await User.find({}, { id: 1, username: 1, level: 1, xp: 1, streak: 1 })
      .sort({ level: -1, xp: -1 })
      .limit(20)
      .lean();

    const leaderboard = users.map((u, idx) => ({
      rank: idx + 1,
      username: u.username,
      level: u.level,
      xp: u.xp,
      streak: u.streak,
    }));

    res.json(leaderboard);
  } catch (err) {
    req.log.error({ err }, "Get leaderboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
