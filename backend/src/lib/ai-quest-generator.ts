import { logger } from "./logger.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserQuestInput {
  goals: string[];
  level: "beginner" | "intermediate" | "advanced";
  dailyTime: number; // minutes
  weaknesses: string[];
  preferredTime: "morning" | "afternoon" | "night";
  pastPerformance: {
    streak: number;
    completionRate: number; // 0–100
    recentMissedTasks: number;
  };
}

export interface GeneratedQuest {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  duration: number;
  xp: number;
  category: string;
}

export interface GeneratedQuestsResponse {
  quests: GeneratedQuest[];
  summary: string;
}

export class AIQuestGenerationError extends Error {
  readonly statusCode: number;
  readonly providerStatus?: number;

  constructor(message: string, statusCode = 502, providerStatus?: number) {
    super(message);
    this.name = "AIQuestGenerationError";
    this.statusCode = statusCode;
    this.providerStatus = providerStatus;
  }
}

// ─── XP Constants ────────────────────────────────────────────────────────────

const XP_RANGES: Record<string, { min: number; max: number }> = {
  easy: { min: 30, max: 50 },
  medium: { min: 50, max: 80 },
  hard: { min: 80, max: 120 },
};

// ─── Difficulty Adaptation ───────────────────────────────────────────────────

interface DifficultyProfile {
  questCount: number;
  distribution: Array<"easy" | "medium" | "hard">;
  addBonus: boolean;
  guidanceNote: string;
}

function computeDifficultyProfile(input: UserQuestInput): DifficultyProfile {
  const { pastPerformance, level } = input;
  const { streak, completionRate, recentMissedTasks } = pastPerformance;

  // Struggling player: reduce load, build momentum
  if (completionRate < 50 || recentMissedTasks > 3) {
    return {
      questCount: 3,
      distribution: ["easy", "easy", "medium"],
      addBonus: false,
      guidanceNote:
        "Player is struggling. Generate SHORT, achievable tasks focused on rebuilding momentum. " +
        "Each task must take ≤15 minutes. Prefer habits over challenges.",
    };
  }

  // High-performing player: push them
  if (completionRate >= 80 && streak >= 5) {
    const baseDistribution: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "medium", "hard"];
    return {
      questCount: 5,
      distribution: [...baseDistribution, "hard"],
      addBonus: true,
      guidanceNote:
        "Player is on a HOT STREAK. Add a bonus challenge quest. " +
        "Make the hard quests genuinely demanding. Push their boundaries.",
    };
  }

  // Advanced player: standard-hard
  if (level === "advanced") {
    return {
      questCount: 4,
      distribution: ["easy", "medium", "hard", "hard"],
      addBonus: false,
      guidanceNote:
        "Player is advanced. Tasks should assume competence. " +
        "Use specific metrics and challenging targets.",
    };
  }

  // Beginner player: standard-easy
  if (level === "beginner") {
    return {
      questCount: 3,
      distribution: ["easy", "medium", "medium"],
      addBonus: false,
      guidanceNote:
        "Player is a beginner. Tasks should be approachable and clearly explained. " +
        "Avoid jargon. Include concrete step counts or page numbers.",
    };
  }

  // Intermediate: balanced default
  return {
    questCount: 4,
    distribution: ["easy", "medium", "medium", "hard"],
    addBonus: false,
    guidanceNote: "Standard difficulty distribution for intermediate player.",
  };
}

// ─── Weakness Task Archetypes ────────────────────────────────────────────────

function getWeaknessDirectives(weaknesses: string[]): string {
  const directives: string[] = [];

  for (const w of weaknesses) {
    const lower = w.toLowerCase().trim();
    switch (lower) {
      case "consistency":
        directives.push(
          '- CONSISTENCY weakness: Generate small, repeatable daily habits. Examples: "Do 15 pushups before breakfast", "Read 5 pages of current book", "Write 3 sentences in your journal". Tasks should take ≤10 min each.',
        );
        break;
      case "focus":
        directives.push(
          '- FOCUS weakness: Generate deep work blocks with explicit distraction rules. Examples: "50-minute focused coding sprint: phone in another room, single browser tab", "30-minute study block: noise-canceling headphones, Pomodoro timer active". Must specify anti-distraction measures.',
        );
        break;
      case "discipline":
        directives.push(
          '- DISCIPLINE weakness: Generate structured routine tasks with checklists. Examples: "Follow 30-minute morning routine: wake at 6:30, cold water, stretch, plan 3 priorities", "Complete evening shutdown: review tasks, prep clothes, set alarm". Include time anchors.',
        );
        break;
      case "motivation":
        directives.push(
          '- MOTIVATION weakness: Generate quick-reward tasks with visible outcomes. Examples: "Build one feature of your side project and screenshot it", "Complete 5 LeetCode easy problems and track your score", "Clean and organize desk — take before/after photos". Outcome must be tangible.',
        );
        break;
      case "time_management":
      case "time management":
        directives.push(
          '- TIME MANAGEMENT weakness: Generate Pomodoro-structured tasks. Examples: "2× Pomodoro cycles (25 min work + 5 min break): finish chapter 3 notes", "Time-block your afternoon: 3 tasks × 20 min each with 5 min transitions". Include explicit time boundaries.',
        );
        break;
      default:
        directives.push(
          `- ${w.toUpperCase()} weakness: Generate tasks specifically targeting improvement in "${w}". Be concrete and measurable.`,
        );
    }
  }

  return directives.length > 0
    ? `\nWEAKNESS-SPECIFIC DIRECTIVES:\n${directives.join("\n")}`
    : "";
}

// ─── Time-of-Day Bias ────────────────────────────────────────────────────────

function getTimeDirective(preferredTime: string): string {
  switch (preferredTime) {
    case "morning":
      return "TIME BIAS: Morning — favor energizing tasks: physical exercise, creative work, daily planning, outdoor activities. Front-load the hardest quest.";
    case "afternoon":
      return "TIME BIAS: Afternoon — favor analytical tasks: studying, problem-solving, skill practice, focused reading. Place medium-difficulty tasks here.";
    case "night":
      return "TIME BIAS: Night — favor reflective tasks: journaling, reviewing progress, reading, planning tomorrow, meditation. Hard quests should be cerebral, not physical.";
    default:
      return "";
  }
}

// ─── Prompt Builder ──────────────────────────────────────────────────────────

function buildPrompt(input: UserQuestInput): string {
  const profile = computeDifficultyProfile(input);
  const weaknessSection = getWeaknessDirectives(input.weaknesses);
  const timeDirective = getTimeDirective(input.preferredTime);

  const distributionStr = profile.distribution
    .map((d, i) => `  Quest ${i + 1}: ${d}`)
    .join("\n");

  return `You are QuestForge, an AI quest master for a gamified self-improvement app. You generate personalized, specific, actionable daily quests.

ABSOLUTE RULES:
1. Return ONLY valid JSON. No markdown. No code fences. No explanations.
2. Every quest title MUST use a strong action verb and be hyper-specific.
3. NEVER generate vague tasks like "study more", "exercise", "be productive", "work on goals", "practice skills".
4. Every task MUST include at least ONE concrete metric: a number, a duration, a page count, a rep count, or a measurable outcome.
5. Tasks must be completable in a single session — no multi-day tasks.
6. Each quest's "category" must be one of the player's stated goals (matched exactly).

BAD EXAMPLES (NEVER generate these):
- "Study for your exam" → too vague
- "Exercise today" → no specifics
- "Read a book" → no page count
- "Work on coding" → no deliverable
- "Be more disciplined" → not actionable

GOOD EXAMPLES:
- "Solve 3 binary search problems on LeetCode in under 45 minutes"
- "Run 2km at a pace under 7:00/km — track with a stopwatch"
- "Write 500 words of your essay's introduction paragraph"
- "Complete 4 sets of 12 pushups, 15 squats, and 20 crunches"
- "Read pages 45–65 of 'Atomic Habits' and write 3 key takeaways"

PLAYER PROFILE:
- Goals: [${input.goals.map((g) => `"${g}"`).join(", ")}]
- Skill Level: ${input.level}
- Available Time: ${input.dailyTime} minutes total (DO NOT EXCEED)
- Weaknesses: ${input.weaknesses.length > 0 ? input.weaknesses.join(", ") : "none specified"}
- Preferred Time: ${input.preferredTime}
- Current Streak: ${input.pastPerformance.streak} days
- Completion Rate: ${input.pastPerformance.completionRate}%
- Recently Missed Tasks: ${input.pastPerformance.recentMissedTasks}

REQUIRED QUEST DISTRIBUTION (exactly ${profile.questCount} quests):
${distributionStr}
${profile.addBonus ? "  BONUS Quest: medium or hard (streak reward!)" : ""}

DIFFICULTY CONTEXT:
${profile.guidanceNote}

${timeDirective}
${weaknessSection}

XP RANGES:
- easy: 30–50 XP
- medium: 50–80 XP
- hard: 80–120 XP

CONSTRAINTS:
- Total duration of ALL quests combined MUST be ≤ ${input.dailyTime} minutes.
- Each quest category MUST be one of: ${input.goals.map((g) => `"${g}"`).join(", ")}.
- Distribute quests across the player's goals — don't put all quests in one category.
- The summary should mention the player's streak if ≥3 and offer encouragement.

Return ONLY this exact JSON structure (no markdown, no code fences):
{
  "quests": [
    {
      "title": "specific action-verb task title with metrics",
      "difficulty": "easy",
      "duration": 20,
      "xp": 40,
      "category": "one of the player's goals"
    }
  ],
  "summary": "1-2 sentence personalized guidance for today"
}`;
}

// ─── Category Mapping ────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  fitness: "strength", gym: "strength", workout: "strength",
  exercise: "strength", strength: "strength", sports: "strength",
  coding: "intelligence", programming: "intelligence", study: "intelligence",
  learning: "intelligence", reading: "intelligence", intelligence: "intelligence",
  math: "intelligence", science: "intelligence",
  discipline: "discipline", habits: "discipline", routine: "discipline",
  productivity: "discipline", focus: "discipline", consistency: "discipline",
  health: "health", nutrition: "health", sleep: "health",
  meditation: "health", mindfulness: "health", wellness: "health",
  creativity: "intelligence",
};

function mapCategory(raw: string): string {
  const lower = raw.toLowerCase().replace(/[\s\-]/g, "_");
  return CATEGORY_MAP[lower] || "discipline";
}

// ─── Groq Provider ─────────────────────────────────────────────────────────────
import Groq from "groq-sdk";

const DEFAULT_MODELS = ["llama-3.3-70b-versatile", "llama3-8b-8192"];

function getCandidateModels(): string[] {
  const configured = process.env["GROQ_AI_MODEL"]?.trim();
  if (!configured) return DEFAULT_MODELS;
  return [configured, ...DEFAULT_MODELS.filter((m) => m !== configured)];
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown AI provider error";
  }
}

function getProviderStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;

  const record = err as Record<string, unknown>;
  const direct = record["status"] ?? record["code"];
  if (typeof direct === "number") return direct;

  const nested = record["error"];
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    const nestedStatus = nestedRecord["status"] ?? nestedRecord["code"];
    if (typeof nestedStatus === "number") return nestedStatus;
  }

  return undefined;
}

function isModelUnavailableError(message: string, status?: number): boolean {
  if (status === 404) return true;
  return /model.+(not found|unsupported|not available)|404/i.test(message);
}

// ─── Response Parsing & Validation ───────────────────────────────────────────

function parseAndValidate(
  raw: string,
  input: UserQuestInput,
): GeneratedQuestsResponse {
  // Strip accidental markdown fences
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: GeneratedQuestsResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    logger.error({ raw }, "Failed to parse Groq response as JSON");
    throw new AIQuestGenerationError("AI returned invalid JSON", 502);
  }

  if (!parsed.quests || !Array.isArray(parsed.quests) || parsed.quests.length === 0) {
    throw new AIQuestGenerationError("AI returned no quests", 502);
  }

  // ─── Enforce time budget (trim quests that overflow) ───────────────────
  let runningTotal = 0;
  parsed.quests = parsed.quests.filter((q) => {
    const dur = Math.max(1, Math.round(q.duration || 5));
    q.duration = dur;
    runningTotal += dur;
    return runningTotal <= input.dailyTime;
  });

  if (parsed.quests.length === 0) {
    throw new AIQuestGenerationError(
      "All generated quests exceeded the time budget",
      502,
    );
  }

  // ─── Enforce XP ranges + normalize fields ─────────────────────────────
  for (const quest of parsed.quests) {
    // Normalize difficulty
    if (!["easy", "medium", "hard"].includes(quest.difficulty)) {
      quest.difficulty = "medium";
    }

    // Clamp XP to difficulty range
    const range = XP_RANGES[quest.difficulty]!;
    quest.xp = Math.max(range.min, Math.min(range.max, Math.round(quest.xp)));

    // Map category to app categories
    quest.category = mapCategory(quest.category);

    // Sanitize title
    quest.title = String(quest.title || "").trim();
    if (!quest.title) {
      quest.title = `Complete a ${quest.difficulty} ${quest.category} task`;
    }
  }

  // Ensure summary exists
  if (!parsed.summary || typeof parsed.summary !== "string") {
    parsed.summary = "Your personalized quests for today are ready. Let's level up!";
  }

  return parsed;
}

// ─── Main Generator (public API) ─────────────────────────────────────────────

export async function generateDailyQuests(
  userData: UserQuestInput,
): Promise<GeneratedQuestsResponse & { model: string }> {
  const apiKey = process.env["GROQ_API_KEY"];

  if (!apiKey) {
    throw new AIQuestGenerationError(
      "AI service not configured. Please set GROQ_API_KEY.",
      503,
    );
  }

  const groq = new Groq({ apiKey });
  const prompt = buildPrompt(userData);
  let raw = "";
  let selectedModel: string | null = null;
  let lastProviderError: unknown;

  for (const modelName of getCandidateModels()) {
    try {
      logger.info(
        { goals: userData.goals, dailyTime: userData.dailyTime, model: modelName },
        "Generating AI quests via Groq",
      );

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: modelName,
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      raw = completion.choices[0]?.message?.content?.trim() || "";
      selectedModel = modelName;
      break;
    } catch (err) {
      const status = getProviderStatus(err);
      const message = toErrorMessage(err);

      logger.warn(
        { err, model: modelName, status },
        "Groq generation attempt failed",
      );

      if (isModelUnavailableError(message, status)) {
        lastProviderError = err;
        continue;
      }

      throw new AIQuestGenerationError(
        `AI provider request failed: ${message}`,
        status === 429 ? 503 : 502,
        status,
      );
    }
  }

  if (!raw || !selectedModel) {
    const fallbackMessage = toErrorMessage(lastProviderError);
    throw new AIQuestGenerationError(
      `No compatible AI model available. ${fallbackMessage}`,
      503,
      getProviderStatus(lastProviderError),
    );
  }

  const result = parseAndValidate(raw, userData);

  logger.info(
    {
      model: selectedModel,
      questCount: result.quests.length,
      totalDuration: result.quests.reduce((s, q) => s + q.duration, 0),
      totalXP: result.quests.reduce((s, q) => s + q.xp, 0),
    },
    "AI quests generated successfully",
  );

  return { ...result, model: selectedModel };
}

// ─── Exported for testing ────────────────────────────────────────────────────

export { buildPrompt, computeDifficultyProfile };

// ─── Onboarding Profile Quest Generation ─────────────────────────────────────

export interface OnboardingProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  goals: string[];
  schedule: {
    wakeUpTime: string;
    sleepTime: string;
    workStart: string | null;
    workEnd: string | null;
    commuteMinutes: number;
    freeTimeMinutes?: number;
  };
  skillLevels: {
    coding: "beginner" | "intermediate" | "advanced";
    fitness: "beginner" | "intermediate" | "advanced";
    studyConsistency: "low" | "medium" | "high";
  };
  personality: {
    distractedEasily: boolean;
    stressLevel: "low" | "medium" | "high";
    chronotype: "morning" | "night";
  };
}

/** Convert HH:MM string to total minutes from midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Calculate free minutes from daily schedule */
function calcFreeMinutes(schedule: OnboardingProfile["schedule"]): number {
  const wake = timeToMinutes(schedule.wakeUpTime);
  const sleep = timeToMinutes(schedule.sleepTime);
  const awakeMinutes = sleep > wake ? sleep - wake : (24 * 60 - wake) + sleep;

  let busyMinutes = schedule.commuteMinutes;
  if (schedule.workStart && schedule.workEnd) {
    const ws = timeToMinutes(schedule.workStart);
    const we = timeToMinutes(schedule.workEnd);
    busyMinutes += we > ws ? we - ws : 0;
  }

  // Reserve 90 min for meals/hygiene/misc
  return Math.max(20, Math.min(awakeMinutes - busyMinutes - 90, 480));
}

/** Derive weaknesses from personality traits */
function deriveWeaknesses(personality: OnboardingProfile["personality"]): string[] {
  const weaknesses: string[] = [];
  if (personality.distractedEasily) weaknesses.push("focus");
  if (personality.stressLevel === "high") weaknesses.push("consistency");
  return weaknesses;
}

/** Map studyConsistency to completionRate % */
function consistencyToRate(c: "low" | "medium" | "high"): number {
  return c === "high" ? 80 : c === "medium" ? 55 : 30;
}

/** Map the dominant skill level across selected goals */
function deriveLevel(
  goals: string[],
  skillLevels: OnboardingProfile["skillLevels"],
): "beginner" | "intermediate" | "advanced" {
  const hasCoding = goals.some((g) => ["coding", "study", "productivity"].includes(g));
  const hasFitness = goals.some((g) => ["fitness", "muscle_gain", "weight_loss"].includes(g));

  const levels: string[] = [];
  if (hasCoding) levels.push(skillLevels.coding);
  if (hasFitness) levels.push(skillLevels.fitness);
  if (levels.length === 0) levels.push("beginner");

  if (levels.every((l) => l === "advanced")) return "advanced";
  if (levels.some((l) => l === "intermediate" || l === "advanced")) return "intermediate";
  return "beginner";
}

/**
 * Generate first-day quests from an onboarding life profile.
 * Respects schedule constraints and derives difficulty from personality.
 */
export async function generateOnboardingQuests(
  profile: OnboardingProfile,
): Promise<GeneratedQuestsResponse & { model: string }> {
  const freeTime = profile.schedule.freeTimeMinutes ?? calcFreeMinutes(profile.schedule);
  const weaknesses = deriveWeaknesses(profile.personality);
  const level = deriveLevel(profile.goals, profile.skillLevels);
  const completionRate = consistencyToRate(profile.skillLevels.studyConsistency);

  const goalMap: Record<string, string> = {
    fitness: "fitness", muscle_gain: "fitness", weight_loss: "fitness",
    coding: "coding", study: "study", reading: "reading",
    meditation: "health", productivity: "productivity", discipline: "discipline",
  };
  const uniqueGoals = [...new Set(profile.goals.map((g) => goalMap[g] ?? g))];

  const input: UserQuestInput = {
    goals: uniqueGoals,
    level,
    dailyTime: freeTime,
    weaknesses,
    preferredTime: profile.personality.chronotype === "morning" ? "morning" : "night",
    pastPerformance: { streak: 0, completionRate, recentMissedTasks: 0 },
  };

  logger.info({ freeTime, level, weaknesses, goals: uniqueGoals }, "Generating onboarding quests");

  return generateDailyQuests(input);
}
