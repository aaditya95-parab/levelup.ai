import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRank } from "../lib/ranks";

type XPGain = { id: string; amount: number; x: number; y: number };

interface LevelUpContextType {
  triggerLevelUp: (newLevel: number) => void;
  triggerXPGain: (amount: number, event: React.MouseEvent) => void;
}

const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);

// Generate random particles for level-up celebration
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i + (Math.random() - 0.5) * 30,
    distance: 80 + Math.random() * 200,
    size: 3 + Math.random() * 6,
    delay: Math.random() * 0.4,
    duration: 1 + Math.random() * 1,
    color: [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      '#fff',
      'hsl(192 100% 70%)',
      'hsl(258 90% 80%)',
    ][Math.floor(Math.random() * 5)]!,
  }));
}

export function LevelUpProvider({ children }: { children: ReactNode }) {
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [xpGains, setXpGains] = useState<XPGain[]>([]);

  const particles = useMemo(() => generateParticles(40), [levelUp]);

  const triggerLevelUp = useCallback((newLevel: number) => {
    setLevelUp(newLevel);
    setTimeout(() => setLevelUp(null), 4000);
  }, []);

  const triggerXPGain = useCallback((amount: number, event: React.MouseEvent) => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = event.clientX;
    const y = event.clientY;
    setXpGains((prev) => [...prev, { id, amount, x, y }]);
    setTimeout(() => {
      setXpGains((prev) => prev.filter((g) => g.id !== id));
    }, 1800);
  }, []);

  const rank = levelUp ? getRank(levelUp) : null;

  return (
    <LevelUpContext.Provider value={{ triggerLevelUp, triggerXPGain }}>
      {children}

      {/* ── Level Up Overlay ── */}
      <AnimatePresence>
        {levelUp !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-none"
          >
            {/* Expanding rings */}
            {[0, 0.3, 0.6].map((delay, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 2, delay, ease: "easeOut" }}
                className="absolute w-32 h-32 rounded-full border-2 border-primary/40"
              />
            ))}

            {/* Particles */}
            {particles.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * p.distance;
              const ty = Math.sin(rad) * p.distance;
              return (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{ x: tx, y: ty, scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
                  transition={{ duration: p.duration, delay: 0.2 + p.delay, ease: "easeOut" }}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  }}
                />
              );
            })}

            <div className="text-center relative z-10">
              {/* Level diamond */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, rotate: 45 }}
                animate={{ scale: [1, 1.15, 1], opacity: 1, rotate: 45 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-32 h-32 mx-auto bg-primary/20 border-2 border-primary shadow-[0_0_60px_hsl(var(--primary)/0.6)] flex items-center justify-center mb-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                  className="-rotate-45 text-5xl font-display font-bold text-white glow-text"
                >
                  {levelUp}
                </motion.div>
              </motion.div>
              
              {/* Level Up text */}
              <motion.h1
                initial={{ y: 60, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="text-7xl md:text-9xl font-bold font-display text-primary glow-text tracking-[0.2em] uppercase"
              >
                Level Up
              </motion.h1>

              {/* Rank title */}
              {rank && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className={`mt-4 text-3xl font-display font-bold uppercase tracking-[0.3em] ${rank.color}`}
                  style={{ textShadow: `0 0 20px ${rank.glowColor}` }}
                >
                  {rank.title}
                </motion.div>
              )}

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-4 text-xl font-display text-muted-foreground uppercase tracking-widest"
              >
                Combat capabilities increased
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── XP Gain Floating Text ── */}
      {xpGains.map((gain) => (
        <motion.div
          key={gain.id}
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], y: -120, scale: [0.5, 1.4, 1.2, 1], x: (Math.random() - 0.5) * 40 }}
          transition={{ duration: 1.8, ease: "easeOut", times: [0, 0.15, 0.3, 1] }}
          className="fixed z-[60] pointer-events-none flex flex-col items-center"
          style={{ left: gain.x - 30, top: gain.y - 20 }}
        >
          <span className="text-secondary font-bold font-display text-3xl drop-shadow-[0_0_12px_hsl(var(--secondary)/0.9)]">
            +{gain.amount} XP
          </span>
          {/* Small sparkle particles around the XP text */}
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                x: [0, (i % 2 === 0 ? 1 : -1) * (15 + Math.random() * 20)],
                y: [0, -(10 + Math.random() * 30)],
              }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
              className="absolute w-1.5 h-1.5 rounded-full bg-secondary"
              style={{ boxShadow: '0 0 6px hsl(var(--secondary))' }}
            />
          ))}
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
