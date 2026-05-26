import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { User } from "../models/user.js";

const router = Router();

function xpToNextLevel(level: number): number {
  return 100 * level;
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
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
