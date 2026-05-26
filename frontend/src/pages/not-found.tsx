import { motion } from "framer-motion";
import { Skull, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex items-center justify-center relative overflow-hidden font-sans p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-destructive/10 via-background to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <Skull className="w-24 h-24 mx-auto text-destructive mb-8 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
        </motion.div>

        <h1 className="text-8xl font-display font-bold text-white uppercase tracking-widest mb-4 glow-text" style={{ textShadow: '0 0 30px rgba(239,68,68,0.3)' }}>
          404
        </h1>
        <p className="text-xl font-display text-muted-foreground uppercase tracking-[0.3em] mb-2">
          Area Not Found
        </p>
        <p className="text-sm text-muted-foreground/60 font-display uppercase tracking-widest mb-10">
          This zone has not been unlocked yet
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-3 px-8 py-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 font-display font-bold uppercase tracking-widest rounded-md transition-all glow-box hover:shadow-[0_0_25px_hsl(var(--primary)/0.3)]"
        >
          <ArrowLeft className="w-5 h-5" /> Return to Base
        </Link>
      </motion.div>
    </div>
  );
}
