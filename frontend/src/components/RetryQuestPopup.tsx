import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import "./RetryQuestPopup.css";

interface RetryQuestPopupProps {
  isOpen: boolean;
  questTitle: string;
  elapsedMinutes: number;
  minMinutes: number;
  recommendedMinutes: number;
  forceCompleteCount: number;
  sincerityScore: number;
  onRetry: () => void;
  onForceComplete: () => void;
  onClose: () => void;
}

export function RetryQuestPopup({
  isOpen,
  questTitle,
  elapsedMinutes,
  minMinutes,
  recommendedMinutes,
  forceCompleteCount,
  sincerityScore,
  onRetry,
  onForceComplete,
  onClose,
}: RetryQuestPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="retry-quest-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="retry-quest-modal"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="retry-quest-header">
              <div className="retry-quest-icon">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="retry-quest-title">Quest Completed Too Quickly</div>
                <div className="retry-quest-subtitle">Sincerity check for {questTitle}</div>
              </div>
            </div>

            <div className="retry-quest-body">
              <p>
                The completion time does not match the expected effort for this mission.
                Confirm sincerity before proceeding.
              </p>
              <div className="retry-quest-metrics">
                <div>
                  <div className="retry-quest-label">Elapsed</div>
                  <div className="retry-quest-value">{elapsedMinutes} min</div>
                </div>
                <div>
                  <div className="retry-quest-label">Minimum</div>
                  <div className="retry-quest-value">{minMinutes} min</div>
                </div>
                <div>
                  <div className="retry-quest-label">Recommended</div>
                  <div className="retry-quest-value">{recommendedMinutes} min</div>
                </div>
              </div>
              <div className="retry-quest-sincerity">
                <ShieldCheck className="w-4 h-4" />
                <span>Sincerity score: {sincerityScore}</span>
                <span>Force completes: {forceCompleteCount}</span>
              </div>
            </div>

            <div className="retry-quest-actions">
              <button type="button" className="retry-quest-retry" onClick={onRetry}>
                Retry Quest
              </button>
              <button type="button" className="retry-quest-force" onClick={onForceComplete}>
                Force Complete Anyway
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
