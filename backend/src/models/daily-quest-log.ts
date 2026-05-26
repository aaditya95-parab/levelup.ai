import { Schema, model, type InferSchemaType } from "mongoose";

const generatedQuestSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    duration: { type: Number, required: true },
    xp: { type: Number, required: true },
    category: { type: String, required: true },
  },
  { _id: false },
);

const dailyQuestLogSchema = new Schema(
  {
    userId: { type: Number, required: true, index: true },
    generatedAt: { type: Date, default: Date.now, index: true },
    model: { type: String, required: true },
    input: {
      goals: [String],
      level: { type: String, enum: ["beginner", "intermediate", "advanced"] },
      dailyTime: Number,
      weaknesses: [String],
      preferredTime: { type: String, enum: ["morning", "afternoon", "night"] },
      pastPerformance: {
        streak: Number,
        completionRate: Number,
        recentMissedTasks: Number,
      },
    },
    quests: [generatedQuestSchema],
    summary: { type: String, required: true },
    accepted: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
  },
  { versionKey: false, id: false },
);

// Compound index for efficient lookups: "did this user already generate today?"
dailyQuestLogSchema.index({ userId: 1, generatedAt: -1 });

export type DailyQuestLogDocument = InferSchemaType<typeof dailyQuestLogSchema>;

export const DailyQuestLog = model<DailyQuestLogDocument>(
  "DailyQuestLog",
  dailyQuestLogSchema,
);
