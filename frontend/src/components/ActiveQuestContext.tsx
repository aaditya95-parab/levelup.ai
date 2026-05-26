import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ActiveQuest = {
  id: number;
  title: string;
  description?: string | null;
  category: "strength" | "intelligence" | "discipline" | "health";
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  acceptedAt: string;
  recommendedMinutes: number;
};

type ActiveQuestContextValue = {
  activeQuest: ActiveQuest | null;
  setActiveQuest: (quest: ActiveQuest) => void;
  clearActiveQuest: () => void;
};

const ACTIVE_QUEST_STORAGE_KEY = "active-quest-v1";

const ActiveQuestContext = createContext<ActiveQuestContextValue | undefined>(undefined);

function loadActiveQuest(): ActiveQuest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_QUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveQuest;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function ActiveQuestProvider({ children }: { children: React.ReactNode }) {
  const [activeQuest, setActiveQuestState] = useState<ActiveQuest | null>(() => loadActiveQuest());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeQuest) {
      localStorage.removeItem(ACTIVE_QUEST_STORAGE_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_QUEST_STORAGE_KEY, JSON.stringify(activeQuest));
  }, [activeQuest]);

  const value = useMemo(
    () => ({
      activeQuest,
      setActiveQuest: setActiveQuestState,
      clearActiveQuest: () => setActiveQuestState(null),
    }),
    [activeQuest]
  );

  return <ActiveQuestContext.Provider value={value}>{children}</ActiveQuestContext.Provider>;
}

export function useActiveQuest() {
  const ctx = useContext(ActiveQuestContext);
  if (!ctx) throw new Error("useActiveQuest must be used within ActiveQuestProvider");
  return ctx;
}
