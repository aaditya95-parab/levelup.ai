import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { User } from "../models/user.js";

const router = Router();

function xpToNextLevel(level: number): number {
  return 100 * level;
}

function getTodayDateString(): string {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0]!;
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  return yesterday.toISOString().split("T")[0]!;
}

router.get("/users/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findOne({ id: req.userId! }).lean();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      level: user.level,
      xp: user.xp,
      xpToNextLevel: xpToNextLevel(user.level),
      streak: user.streak,
      stats: user.stats,
      crystals: user.crystals ?? 0,
      loginStreak: user.loginStreak ?? 0,
      lastLoginDate: user.lastLoginDate,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/check-in", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findOne({ id: req.userId! });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    // Check if already claimed today
    if (user.lastLoginDate === today) {
      res.json({ alreadyClaimed: true, loginStreak: user.loginStreak ?? 0 });
      return;
    }

    // Calculate new streak
    let newStreak = 1;
    if (user.lastLoginDate === yesterday) {
      newStreak = (user.loginStreak ?? 0) + 1;
    } else {
      newStreak = 1;
    }

    // Award rewards
    const xpReward = 10;
    const crystalReward = 5;

    const updatedUser = await User.findOneAndUpdate(
      { id: req.userId! },
      {
        $set: {
          lastLoginDate: today,
          loginStreak: newStreak,
        },
        $inc: {
          xp: xpReward,
          crystals: crystalReward,
        },
      },
      { new: true },
    );

    res.json({
      alreadyClaimed: false,
      xpAwarded: xpReward,
      crystalsAwarded: crystalReward,
      loginStreak: newStreak,
      totalXp: updatedUser?.xp ?? 0,
      totalCrystals: updatedUser?.crystals ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Check-in error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
