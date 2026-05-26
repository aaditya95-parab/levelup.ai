import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Clock, Target, Sparkles } from "lucide-react";
import { QuestStatusBadge, type QuestStatusType } from "./QuestStatusBadge";
import { QuestAcceptButton } from "./QuestAcceptButton";
import { QuestTimer } from "./QuestTimer";
import "./QuestDetailsModal.css";

export interface QuestDetailsModalQuest {
  title: string;
  description?: string | null;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  completed: boolean;
}

export interface QuestDetails {
  description: string;
  steps: string[];
  tips: string[];
  recommendedMinutes: number;
  minMinutes: number;
}

interface QuestDetailsModalProps {
  isOpen: boolean;
  quest: QuestDetailsModalQuest | null;
  details: QuestDetails | null;
  status: QuestStatusType;
  acceptedAt: string | null;
  recommendedMinutes: number;
  sincerityScore: number;
  forceCompleteCount: number;
  onAccept: () => void;
  onClose: () => void;
}

export function QuestDetailsModal({
  isOpen,
  quest,
  details,
  status,
  acceptedAt,
  recommendedMinutes,
  sincerityScore,
  forceCompleteCount,
  onAccept,
  onClose,
}: QuestDetailsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && quest && details && (
        <motion.div
          className="quest-details-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="quest-details-modal"
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="quest-details-header">
              <div>
                <div className="quest-details-eyebrow">Mission Briefing</div>
                <h2 className="quest-details-title">{quest.title}</h2>
              </div>
              <QuestStatusBadge status={status} />
            </div>

            <div className="quest-details-meta">
              <div className="quest-details-meta-item">
                <Target className="quest-details-icon" />
                <span className="quest-details-meta-label">Category</span>
                <span className="quest-details-meta-value">{quest.category}</span>
              </div>
              <div className="quest-details-meta-item">
                <Sparkles className="quest-details-icon" />
                <span className="quest-details-meta-label">Difficulty</span>
                <span className="quest-details-meta-value">{quest.difficulty}</span>
              </div>
              <div className="quest-details-meta-item">
                <ScrollText className="quest-details-icon" />
                <span className="quest-details-meta-label">Reward</span>
                <span className="quest-details-meta-value">+{quest.xpReward} XP</span>
              </div>
              <div className="quest-details-meta-item">
                <Clock className="quest-details-icon" />
                <span className="quest-details-meta-label">Estimated Time</span>
                <span className="quest-details-meta-value">{recommendedMinutes} min</span>
              </div>
            </div>

            <div className="quest-details-section">
              <div className="quest-details-section-title">Objective</div>
              <p className="quest-details-text">{details.description}</p>
            </div>

            <div className="quest-details-grid">
              <div className="quest-details-section">
                <div className="quest-details-section-title">Operational Steps</div>
                <ol className="quest-details-list">
                  {details.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="quest-details-section">
                <div className="quest-details-section-title">Focus Tips</div>
                <ul className="quest-details-list">
                  {details.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            {acceptedAt && (
              <div className="quest-details-section">
                <div className="quest-details-section-title">Active Timer</div>
                <QuestTimer acceptedAt={acceptedAt} recommendedMinutes={recommendedMinutes} completed={quest.completed} />
              </div>
            )}

            <div className="quest-details-section quest-details-sincerity">
              <div className="quest-details-section-title">Sincerity Protocol</div>
              <div className="quest-details-sincerity-grid">
                <div>
                  <div className="quest-details-meta-label">Minimum Time</div>
                  <div className="quest-details-meta-value">{details.minMinutes} min</div>
                </div>
                <div>
                  <div className="quest-details-meta-label">Sincerity Score</div>
                  <div className="quest-details-meta-value">{sincerityScore}</div>
                </div>
                <div>
                  <div className="quest-details-meta-label">Force Completes</div>
                  <div className="quest-details-meta-value">{forceCompleteCount}</div>
                </div>
              </div>
              <div className="quest-details-hint">
                Repeated force completions reduce sincerity score for future balancing.
              </div>
            </div>

            <div className="quest-details-footer">
              {!quest.completed && (
                <QuestAcceptButton
                  accepted={status === "active"}
                  completed={quest.completed}
                  size="md"
                  onAccept={() => onAccept()}
                />
              )}
              <button type="button" className="quest-details-close" onClick={onClose}>
                Close Briefing
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
