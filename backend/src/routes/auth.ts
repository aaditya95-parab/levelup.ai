import { Router } from "express";
import bcrypt from "bcryptjs";
import { RegisterUserBody, LoginUserBody } from "../validation.js";
import { signToken } from "../middlewares/auth.js";
import { getNextSequence } from "../models/counter.js";
import { User, type UserDocument } from "../models/user.js";

const router = Router();

function xpToNextLevel(level: number): number {
  return 100 * level;
}

function buildUserProfile(user: UserDocument) {
  return {
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
    lastLoginDate: user.lastLoginDate ?? null,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { username, email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = await getNextSequence("users");
    const user = await User.create({
      id,
      username,
      email: normalizedEmail,
      passwordHash,
      level: 1,
      xp: 0,
      streak: 0,
      longestStreak: 0,
      stats: { strength: 0, intelligence: 0, discipline: 0, health: 0 },
      loginStreak: 0,
      lastLoginDate: null,
      crystals: 0,
    });

    const token = signToken(user.id);
    res.status(201).json({ token, user: buildUserProfile(user.toObject()) });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken(user.id);
    res.json({ token, user: buildUserProfile(user) });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
