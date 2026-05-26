import { Schema, model, type InferSchemaType } from "mongoose";

const questSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      default: "easy",
    },
    category: {
      type: String,
      enum: ["strength", "intelligence", "discipline", "health"],
      required: true,
      default: "discipline",
    },
    xpReward: { type: Number, required: true, default: 50 },
    status: {
      type: String,
      enum: ["available", "active", "completed", "failed"],
      required: true,
      default: "available",
      index: true,
    },
    completed: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false, id: false },
);

export type QuestDocument = InferSchemaType<typeof questSchema>;

export const Quest = model<QuestDocument>("Quest", questSchema);
