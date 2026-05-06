import { Router } from "express";
import { db, usersTable, questsTable } from "@workspace/db";
import { eq, and, count, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();

function xpToNextLevel(level: number): number {
  return 100 * level;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]!;
}

router.get("/stats/summary", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [completedResult] = await db
      .select({ count: count() })
      .from(questsTable)
      .where(and(eq(questsTable.userId, req.userId!), eq(questsTable.completed, true)));

    const [pendingResult] = await db
      .select({ count: count() })
      .from(questsTable)
      .where(and(eq(questsTable.userId, req.userId!), eq(questsTable.completed, false)));

    const today = getTodayDate();
    const [todayResult] = await db
      .select({ count: count() })
      .from(questsTable)
      .where(
        and(
          eq(questsTable.userId, req.userId!),
          eq(questsTable.completed, true),
          sql`DATE(${questsTable.completedAt}) = ${today}`,
        ),
      );

    const totalCompleted = completedResult?.count ?? 0;
    const totalPending = pendingResult?.count ?? 0;
    const questsCompletedToday = todayResult?.count ?? 0;

    const needed = xpToNextLevel(user.level);
    const xpProgress = Math.min(100, Math.round((user.xp / needed) * 100));

    // Estimate total XP earned from completed quests
    const totalXpResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${questsTable.xpReward}), 0)` })
      .from(questsTable)
      .where(and(eq(questsTable.userId, req.userId!), eq(questsTable.completed, true)));

    const totalXpEarned = Number(totalXpResult[0]?.total ?? 0);

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

        const [xpResult] = await db
          .select({ total: sql<number>`COALESCE(SUM(${questsTable.xpReward}), 0)` })
          .from(questsTable)
          .where(
            and(
              eq(questsTable.userId, req.userId!),
              eq(questsTable.completed, true),
              sql`DATE(${questsTable.completedAt}) = ${dateStr}`,
            ),
          );

        const [countResult] = await db
          .select({ count: count() })
          .from(questsTable)
          .where(
            and(
              eq(questsTable.userId, req.userId!),
              eq(questsTable.completed, true),
              sql`DATE(${questsTable.completedAt}) = ${dateStr}`,
            ),
          );

        return {
          date: dateStr,
          xpEarned: Number(xpResult?.total ?? 0),
          questsCompleted: countResult?.count ?? 0,
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
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        level: usersTable.level,
        xp: usersTable.xp,
        streak: usersTable.streak,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.level), desc(usersTable.xp))
      .limit(20);

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
