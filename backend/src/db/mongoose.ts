import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI;

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectToDatabase(): Promise<void> {
  if (!mongoUri) {
    throw new Error("MONGO_URI is required but was not provided.");
  }

  if (!connectionPromise) {
    mongoose.set("strictQuery", true);
    connectionPromise = mongoose.connect(mongoUri);
  }

  await connectionPromise;
}
