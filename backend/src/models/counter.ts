import { Schema, model } from "mongoose";

const counterSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);

const Counter = model("Counter", counterSchema);

export async function getNextSequence(name: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 }, $setOnInsert: { name } },
    { new: true, upsert: true },
  ).lean();

  return doc?.seq ?? 1;
}
