import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Flame, Heart, Shield, ChevronDown, ChevronUp, X } from "lucide-react";
import { useActiveQuest } from "./ActiveQuestContext";
import { ActiveQuestTimer } from "./ActiveQuestTimer";
import { getMinimumMinutes, getQuestBriefing } from "@/lib/quest-briefing";
import "./ActiveQuestHeader.css";

const CATEGORY_ICONS = {
  strength: Shield,
  intelligence: Brain,
  discipline: Flame,
  health: Heart,
} as const;

export function ActiveQuestHeader() {
  const { activeQuest, clearActiveQuest } = useActiveQuest();
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeQuest) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeQuest]);

  useEffect(() => {
    if (!activeQuest) setExpanded(false);
  }, [activeQuest]);

  const briefing = useMemo(() => {
    if (!activeQuest) return null;
    return getQuestBriefing({
      description: activeQuest.description,
      difficulty: activeQuest.difficulty,
      category: activeQuest.category,
    });
  }, [activeQuest]);

  if (!activeQuest || !briefing) return null;

  const CategoryIcon = CATEGORY_ICONS[activeQuest.category];
  const elapsedMinutes = Math.max(0, Math.floor((now - new Date(activeQuest.acceptedAt).getTime()) / 60000));
  const minMinutes = getMinimumMinutes(activeQuest.difficulty, activeQuest.recommendedMinutes);
  const statusLabel = elapsedMinutes >= minMinutes ? "Ready to Complete" : "Quest In Progress";

  return (
    <div className="active-quest-shell">
      <motion.div
        className={`active-quest-header ${expanded ? "expanded" : ""}`}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="active-quest-core">
          <div className="active-quest-icon">
            <CategoryIcon className="w-4 h-4" />
          </div>
          <div className="active-quest-main">
            <div className="active-quest-title">{activeQuest.title}</div>
            <div className="active-quest-meta">
              <span className="active-quest-pill">{activeQuest.category}</span>
              <span className="active-quest-pill">{activeQuest.difficulty}</span>
              <span className="active-quest-pill">+{activeQuest.xpReward} XP</span>
              <span className="active-quest-status">{statusLabel}</span>
            </div>
          </div>
          <div className="active-quest-actions">
            <ActiveQuestTimer
              acceptedAt={activeQuest.acceptedAt}
              recommendedMinutes={activeQuest.recommendedMinutes}
            />
            <button
              type="button"
              className="active-quest-action"
              onClick={() => setExpanded((prev) => !prev)}
              aria-label="Toggle quest details"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Details
            </button>
            <button
              type="button"
              className="active-quest-action danger"
              onClick={() => clearActiveQuest()}
              aria-label="Abandon quest"
            >
              <X className="w-4 h-4" />
              Abandon
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="active-quest-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <div className="active-quest-section-title">Objective</div>
                <p className="active-quest-text">{briefing.description}</p>
              </div>
              <div className="active-quest-grid">
                <div>
                  <div className="active-quest-section-title">Operational Steps</div>
                  <ol className="active-quest-list">
                    {briefing.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="active-quest-section-title">Focus Tips</div>
                  <ul className="active-quest-list">
                    {briefing.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="active-quest-sincerity">
                Minimum time before completion: <span>{briefing.minMinutes} min</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
