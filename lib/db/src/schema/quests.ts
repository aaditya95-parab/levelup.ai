import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const questsTable = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("easy"),
  category: text("category", {
    enum: ["strength", "intelligence", "discipline", "health"],
  })
    .notNull()
    .default("discipline"),
  xpReward: integer("xp_reward").notNull().default(50),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestSchema = createInsertSchema(questsTable).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  completed: true,
});

export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof questsTable.$inferSelect;
