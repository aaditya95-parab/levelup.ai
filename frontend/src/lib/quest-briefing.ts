export type QuestDifficulty = "easy" | "medium" | "hard";
export type QuestCategory = "strength" | "intelligence" | "discipline" | "health";

export type QuestBriefing = {
  description: string;
  steps: string[];
  tips: string[];
  recommendedMinutes: number;
  minMinutes: number;
};

const recommendedMinutesByDifficulty: Record<QuestDifficulty, number> = {
  easy: 15,
  medium: 30,
  hard: 60,
};

const minCompletionRatioByDifficulty: Record<QuestDifficulty, number> = {
  easy: 0.3,
  medium: 0.3,
  hard: 0.3,
};

const categoryBriefing: Record<QuestCategory, { steps: string[]; tips: string[] }> = {
  strength: {
    steps: [
      "Warm up 3-5 minutes to prepare your body.",
      "Complete the main set with strict form.",
      "Record reps, sets, or distance.",
      "Cool down and stretch the target muscles.",
    ],
    tips: [
      "Focus on controlled tempo and breath.",
      "Track small performance gains.",
      "Stop if form breaks down.",
    ],
  },
  intelligence: {
    steps: [
      "Define the objective and clear distractions.",
      "Work in 2-3 focused study blocks.",
      "Summarize key insights in your own words.",
      "Log the result and next action.",
    ],
    tips: [
      "Use a timer and single-task focus.",
      "Capture notes immediately after each block.",
      "End with a quick review.",
    ],
  },
  discipline: {
    steps: [
      "Set a clear start and end time.",
      "Execute the task without task-switching.",
      "Mark completion in your tracker.",
      "Review what slowed you down.",
    ],
    tips: [
      "Reduce friction before starting.",
      "Keep your environment minimal.",
      "Commit to the first 5 minutes.",
    ],
  },
  health: {
    steps: [
      "Prepare a calm, clear space.",
      "Follow the routine mindfully and safely.",
      "Hydrate and note how you feel afterward.",
      "Log completion and any symptoms.",
    ],
    tips: [
      "Prioritize form and consistency.",
      "Use steady breathing as a pacing tool.",
      "Avoid rushing the final minutes.",
    ],
  },
};

export function getRecommendedMinutes(difficulty: QuestDifficulty): number {
  return recommendedMinutesByDifficulty[difficulty];
}

export function getMinimumMinutes(difficulty: QuestDifficulty, recommendedMinutes: number): number {
  const ratio = minCompletionRatioByDifficulty[difficulty];
  return Math.max(3, Math.ceil(recommendedMinutes * ratio));
}

export function getQuestBriefing(input: {
  description?: string | null;
  difficulty: QuestDifficulty;
  category: QuestCategory;
}): QuestBriefing {
  const briefing = categoryBriefing[input.category];
  const description = input.description?.trim()
    ? input.description
    : "Complete the objective with focus, accuracy, and full intent.";
  const recommendedMinutes = getRecommendedMinutes(input.difficulty);
  const minMinutes = getMinimumMinutes(input.difficulty, recommendedMinutes);
  return {
    description,
    steps: Array.from(briefing.steps),
    tips: Array.from(briefing.tips),
    recommendedMinutes,
    minMinutes,
  };
}
