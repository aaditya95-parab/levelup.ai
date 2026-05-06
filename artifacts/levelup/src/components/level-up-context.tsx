import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type XPGain = { id: string; amount: number; x: number; y: number };

interface LevelUpContextType {
  triggerLevelUp: (newLevel: number) => void;
  triggerXPGain: (amount: number, event: React.MouseEvent) => void;
}

const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);

export function LevelUpProvider({ children }: { children: ReactNode }) {
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [xpGains, setXpGains] = useState<XPGain[]>([]);

  const triggerLevelUp = useCallback((newLevel: number) => {
    setLevelUp(newLevel);
    setTimeout(() => setLevelUp(null), 3500);
  }, []);

  const triggerXPGain = useCallback((amount: number, event: React.MouseEvent) => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = event.clientX;
    const y = event.clientY;
    setXpGains((prev) => [...prev, { id, amount, x, y }]);
    setTimeout(() => {
      setXpGains((prev) => prev.filter((g) => g.id !== id));
    }, 1500);
  }, []);

  return (
    <LevelUpContext.Provider value={{ triggerLevelUp, triggerXPGain }}>
      {children}
      <AnimatePresence>
        {levelUp !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-32 h-32 mx-auto rounded-none rotate-45 bg-primary/20 border-2 border-primary shadow-[0_0_50px_hsl(var(--primary)/0.5)] flex items-center justify-center mb-12"
              >
                <div className="-rotate-45 text-5xl font-display font-bold text-white glow-text">{levelUp}</div>
              </motion.div>
              
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="text-7xl md:text-9xl font-bold font-display text-primary glow-text tracking-[0.2em] uppercase"
              >
                Level Up
              </motion.h1>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-2xl font-display text-muted-foreground uppercase tracking-widest"
              >
                Combat capabilities increased
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {xpGains.map((gain) => (
        <motion.div
          key={gain.id}
          initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          animate={{ opacity: 0, y: -100, x: (Math.random() - 0.5) * 50, scale: 1.5 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="fixed z-[60] text-secondary font-bold font-display text-3xl pointer-events-none drop-shadow-[0_0_8px_hsl(var(--secondary)/0.8)]"
          style={{ left: gain.x - 20, top: gain.y - 20 }}
        >
          +{gain.amount} XP
        </motion.div>
      ))}
    </LevelUpContext.Provider>
  );
}

export const useLevelUp = () => {
  const ctx = useContext(LevelUpContext);
  if (!ctx) throw new Error("useLevelUp must be used within a LevelUpProvider");
  return ctx;
};
