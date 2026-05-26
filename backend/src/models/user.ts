import { Schema, model, type InferSchemaType } from "mongoose";

const statsSchema = new Schema(
  {
    strength: { type: Number, default: 0 },
    intelligence: { type: Number, default: 0 },
    discipline: { type: Number, default: 0 },
    health: { type: Number, default: 0 },
  },
  { _id: false },
);

const scheduleSchema = new Schema(
  {
    wakeUpTime: { type: String, default: "06:30" },   // "HH:MM"
    sleepTime: { type: String, default: "23:00" },
    workStart: { type: String, default: null },        // null = no work/college
    workEnd: { type: String, default: null },
    commuteMinutes: { type: Number, default: 0 },
    freeTimeMinutes: { type: Number, default: 120 },  // auto-calculated
  },
  { _id: false },
);

const skillLevelsSchema = new Schema(
  {
    coding: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    fitness: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    studyConsistency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { _id: false },
);

const personalitySchema = new Schema(
  {
    distractedEasily: { type: Boolean, default: false },
    stressLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    chronotype: {
      type: String,
      enum: ["morning", "night"],
      default: "morning",
    },
  },
  { _id: false },
);

const onboardingProfileSchema = new Schema(
  {
    name: { type: String, default: null },
    age: { type: Number, default: null },
    height: { type: Number, default: null },   // cm
    weight: { type: Number, default: null },   // kg
    goals: { type: [String], default: [] },
    schedule: { type: scheduleSchema, default: null },
    skillLevels: { type: skillLevelsSchema, default: null },
    personality: { type: personalitySchema, default: null },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null },
    stats: {
      type: statsSchema,
      default: () => ({ strength: 0, intelligence: 0, discipline: 0, health: 0 }),
    },
    // ── Life Setup System ──────────────────────────────────────────────────
    onboardingComplete: { type: Boolean, default: false },
    profile: { type: onboardingProfileSchema, default: null },
    createdAt: { type: Date, default: Date.now },
    // ── Daily Login Rewards & Streak System ────────────────────────────────
    loginStreak: { type: Number, default: 0 },
    lastLoginDate: { type: String, default: null },  // ISO date string (YYYY-MM-DD)
    crystals: { type: Number, default: 0 },
  },
  { versionKey: false, id: false },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = model<UserDocument>("User", userSchema);
