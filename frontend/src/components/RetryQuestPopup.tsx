import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface RetryQuestPopupProps {
  isOpen: boolean;
  questTitle: string;
  elapsedMinutes: number;
  minMinutes: number;
  recommendedMinutes: number;
  onContinue: () => void;
  onAbandon: () => void;
  onClose: () => void;
}

export function RetryQuestPopup({
  isOpen,
  questTitle,
  elapsedMinutes,
  minMinutes,
  recommendedMinutes,
  onContinue,
  onAbandon,
  onClose,
}: RetryQuestPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md bg-black/80 border border-destructive/50 rounded-xl overflow-hidden shadow-[0_0_50px_hsl(var(--destructive)/0.3)] relative"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Warning Glow / scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive to-transparent animate-pulse" />

            <div className="p-6 border-b border-destructive/20 relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 bg-destructive/20 border border-destructive text-destructive flex items-center justify-center rounded-lg shadow-[0_0_15px_hsl(var(--destructive)/0.5)]">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-destructive uppercase tracking-widest text-shadow-sm glow-text">Quest Incomplete</h2>
                <div className="text-destructive/70 font-display text-xs uppercase tracking-widest mt-1">Sincerity check failed for: {questTitle}</div>
              </div>
            </div>

            <div className="p-6 relative z-10 space-y-6">
              <div className="flex gap-3 items-start p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive/90">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-display tracking-wider uppercase leading-relaxed">
                  The system detected insufficient effort. Mission completion conditions were not satisfied.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/50 border border-white/5 p-3 rounded flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mb-1">Elapsed</div>
                  <div className="text-lg font-bold text-white">{elapsedMinutes}m</div>
                </div>
                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded flex flex-col items-center justify-center text-center shadow-[inset_0_0_15px_hsl(var(--destructive)/0.1)]">
                  <div className="text-[10px] text-destructive/80 font-display uppercase tracking-widest mb-1">Minimum</div>
                  <div className="text-lg font-bold text-destructive">{minMinutes}m</div>
                </div>
                <div className="bg-black/50 border border-white/5 p-3 rounded flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mb-1">Expected</div>
                  <div className="text-lg font-bold text-white">{recommendedMinutes}m</div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground font-display uppercase tracking-widest">
                Return and complete the challenge sincerely.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-6 bg-black/40 border-t border-white/5 relative z-10">
              <button
                type="button"
                className="py-3 px-4 bg-white/5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive border border-white/10 hover:border-destructive/50 rounded transition-all font-display font-bold uppercase tracking-widest text-xs"
                onClick={onAbandon}
              >
                Abandon Quest
              </button>
              <button
                type="button"
                className="py-3 px-4 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/50 rounded transition-all glow-box font-display font-bold uppercase tracking-widest text-xs"
                onClick={onContinue}
              >
                Continue Quest
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
