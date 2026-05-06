import { Router } from "express";
import { db, usersTable, questsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { CreateQuestBody, UpdateQuestBody, UpdateQuestParams, GetQuestsQueryParams } from "@workspace/api-zod";

const router = Router();

const XP_REWARDS: Record<string, number> = {
  easy: 50,
  medium: 100,
  hard: 200,
};

const STAT_MAP: Record<string, keyof { strength: number; intelligence: number; discipline: number; health: number }> = {
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

router.get("/quests", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = GetQuestsQueryParams.safeParse(req.query);
  const completedFilter = parsed.success ? parsed.data.completed : undefined;

  try {
    let conditions = [eq(questsTable.userId, req.userId!)];
    if (completedFilter !== undefined) {
      conditions.push(eq(questsTable.completed, completedFilter));
    }

    const quests = await db
      .select()
      .from(questsTable)
      .where(and(...conditions))
      .orderBy(questsTable.createdAt);

    res.json(quests);
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
    const [quest] = await db
      .insert(questsTable)
      .values({
        userId: req.userId!,
        title,
        description: description ?? null,
        difficulty,
        category,
        xpReward,
        completed: false,
      })
      .returning();

    res.status(201).json(quest);
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
  const { completed, title, description, difficulty, category } = bodyParsed.data;

  try {
    const [existing] = await db
      .select()
      .from(questsTable)
      .where(and(eq(questsTable.id, questId), eq(questsTable.userId, req.userId!)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Quest not found" });
      return;
    }

    const updateValues: Partial<typeof questsTable.$inferInsert> = {};
    if (title !== undefined) updateValues.title = title;
    if (description !== undefined) updateValues.description = description;
    if (difficulty !== undefined) {
      updateValues.difficulty = difficulty;
      updateValues.xpReward = XP_REWARDS[difficulty] ?? existing.xpReward;
    }
    if (category !== undefined) updateValues.category = category;

    let xpGained = 0;
    let leveledUp = false;
    let newLevel: number | null = null;
    let streakUpdated = false;

    if (completed === true && !existing.completed) {
      updateValues.completed = true;
      updateValues.completedAt = new Date();
      xpGained = existing.xpReward;

      // Update user stats
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.userId!))
        .limit(1);

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

        await db
          .update(usersTable)
          .set({
            xp: newXp,
            level: currentLevel,
            stats: updatedStats,
            streak: newStreak,
            longestStreak,
            lastActiveDate: today,
          })
          .where(eq(usersTable.id, req.userId!));

        if (didLevelUp) {
          leveledUp = true;
          newLevel = currentLevel;
        }
        streakUpdated = didStreakUpdate;
      }
    } else if (completed === false && existing.completed) {
      updateValues.completed = false;
      updateValues.completedAt = null;
    }

    const [updatedQuest] = await db
      .update(questsTable)
      .set(updateValues)
      .where(eq(questsTable.id, questId))
      .returning();

    const [updatedUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    res.json({
      quest: updatedQuest,
      user: updatedUser
        ? {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            level: updatedUser.level,
            xp: updatedUser.xp,
            xpToNextLevel: xpToNextLevel(updatedUser.level),
            streak: updatedUser.streak,
            stats: updatedUser.stats,
            createdAt: updatedUser.createdAt,
          }
        : null,
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
    const [existing] = await db
      .select()
      .from(questsTable)
      .where(and(eq(questsTable.id, questId), eq(questsTable.userId, req.userId!)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Quest not found" });
      return;
    }

    await db.delete(questsTable).where(eq(questsTable.id, questId));

    res.json({ success: true, message: "Quest deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete quest error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
