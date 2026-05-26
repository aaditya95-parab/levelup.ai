import { z } from "zod";

// Auth
export const RegisterUserBody = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginUserBody = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Quests
export const GetQuestsQueryParams = z.object({
  completed: z.coerce.boolean().optional(),
});

export const CreateQuestBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.enum(["strength", "intelligence", "discipline", "health"]),
});

export const UpdateQuestParams = z.object({
  questId: z.coerce.number(),
});

export const UpdateQuestBody = z.object({
  completed: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  category: z.enum(["strength", "intelligence", "discipline", "health"]).optional(),
});

// Health
export const HealthCheckResponse = z.object({
  status: z.string(),
});

// AI Quest Generation
export const GenerateQuestsBody = z.object({
  goals: z.array(z.string().min(1).max(50)).min(1).max(10),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  dailyTime: z.number().int().min(10).max(480),
  weaknesses: z.array(z.string().min(1).max(50)).max(10).default([]),
  preferredTime: z.enum(["morning", "afternoon", "night"]),
  pastPerformance: z.object({
    streak: z.number().int().min(0).default(0),
    completionRate: z.number().min(0).max(100).default(50),
    recentMissedTasks: z.number().int().min(0).default(0),
  }),
});

// Onboarding Profile
export const OnboardingProfileBody = z.object({
  name: z.string().min(1).max(60),
  age: z.number().int().min(10).max(100),
  height: z.number().min(50).max(300),   // cm
  weight: z.number().min(20).max(500),   // kg
  goals: z.array(z.enum([
    "fitness", "coding", "discipline", "study",
    "weight_loss", "muscle_gain", "productivity", "reading", "meditation",
  ])).min(1).max(9),
  schedule: z.object({
    wakeUpTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
    sleepTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
    workStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
    workEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
    commuteMinutes: z.number().int().min(0).max(300).default(0),
  }),
  skillLevels: z.object({
    coding: z.enum(["beginner", "intermediate", "advanced"]),
    fitness: z.enum(["beginner", "intermediate", "advanced"]),
    studyConsistency: z.enum(["low", "medium", "high"]),
  }),
  personality: z.object({
    distractedEasily: z.boolean(),
    stressLevel: z.enum(["low", "medium", "high"]),
    chronotype: z.enum(["morning", "night"]),
  }),
});
