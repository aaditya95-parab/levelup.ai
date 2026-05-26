import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gem, Flame } from "lucide-react";
import "./DailyRewardPopup.css";

interface DailyRewardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  xpAwarded: number;
  crystalsAwarded: number;
  loginStreak: number;
}

export function DailyRewardPopup({
  isOpen,
  onClose,
  xpAwarded,
  crystalsAwarded,
  loginStreak,
}: DailyRewardPopupProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="reward-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="reward-popup-modal"
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h2 className="reward-title">Daily Login Bonus!</h2>

            {/* Streak Counter */}
            <div className="reward-streak-section">
              <div className="reward-streak-display">
                <Flame className="reward-flame-icon" />
                <span className="reward-streak-number">{loginStreak}</span>
                <span className="reward-streak-label">Day Streak</span>
              </div>
              {loginStreak >= 7 && (
                <motion.div
                  className="reward-milestone"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  🎉 Week Streak Achievement!
                </motion.div>
              )}
            </div>

            {/* Rewards Grid */}
            <div className="reward-items-grid">
              {/* XP Reward */}
              <motion.div
                className="reward-item xp-item"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Zap className="reward-icon xp-icon" />
                <motion.div
                  className="reward-amount"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  +{xpAwarded}
                </motion.div>
                <div className="reward-label">Experience</div>
              </motion.div>

              {/* Crystal Reward */}
              <motion.div
                className="reward-item crystal-item"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Gem className="reward-icon crystal-icon" />
                <motion.div
                  className="reward-amount"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  +{crystalsAwarded}
                </motion.div>
                <div className="reward-label">Crystals</div>
              </motion.div>
            </div>

            {/* Close Button */}
            <motion.button
              className="reward-close-btn"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Claim & Continue
            </motion.button>

            {/* Auto-close hint */}
            <motion.p
              className="reward-auto-close-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Closing in 3 seconds...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
