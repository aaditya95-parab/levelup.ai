import { useGetProfile, useGetStatsSummary, useGetWeeklyStats, useGetQuests } from "../lib/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Flame, Sword, Brain, Activity, Heart, TrendingUp, Target, Zap, ChevronRight, Crown, Shield, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { getRank, getNextRank } from "../lib/ranks";
import { StreakCounter } from "../components/StreakCounter";
import { DailyRewardPopup } from "../components/DailyRewardPopup";
import "./Dashboard.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../lib/api-client-react/custom-fetch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// ─── Animated Number Counter ───
function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevValue.current = end;
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}
// ─── XP Gain Floating Effect ───
function XpGainEffect({ show, amount, position }: { show: boolean; amount: number; position?: { x: number; y: number } }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="xp-gain"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -40, scale: 1.3 }}
          exit={{ opacity: 0, y: -70, scale: 1.5 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="xp-fly-number absolute top-4 right-6 text-xl z-30"
          style={position ? { left: position.x, top: position.y } : undefined}
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// Build a 28-day heatmap grid from weekly stats
function buildHeatmap(weekly: { date: string; xpEarned: number }[] | undefined) {
  const cells: { date: string; xp: number; dayLabel: string }[] = [];
  const now = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]!;
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "narrow" });
    const match = weekly?.find((w) => w.date === dateStr);
    cells.push({ date: dateStr, xp: match?.xpEarned ?? 0, dayLabel });
  }
  return cells;
}
function getHeatColor(xp: number): string {
  if (xp === 0) return "bg-white/[0.03] border-white/5";
  if (xp < 50) return "bg-primary/20 border-primary/30";
  if (xp < 150) return "bg-primary/40 border-primary/50";
  if (xp < 300) return "bg-primary/60 border-primary/70";
  return "bg-primary/80 border-primary shadow-[0_0_6px_hsl(var(--primary)/0.4)]";
}
function GenerateQuestsButton() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleGenerate = async () => {
    setLoading(true);
    try {
      await customFetch("/api/quests/generate", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      toast({
        title: "Quests Forged",
        description: "Your new quests are ready.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Forge Failed",
        description: err?.data?.error || "Failed to generate quests.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <motion.button
      onClick={handleGenerate}
      disabled={loading}
      className="generate-btn inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-lg font-display uppercase font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ boxShadow: "0 0 20px hsl(var(--primary)/0.2)" }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
          Forging...
        </>
      ) : (
        <>
          <Sword className="w-4 sm:w-5 h-4 sm:h-5" />
          Forge Today's Quests
        </>
      )}
    </motion.button>
  );
}
// ─── Enhanced Stat Card ───
function StatCard({
  stat,
  index,
}: {
  stat: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    glow: string;
    bg: string;
  };
  index: number;
}) {
  const Icon = stat.icon;
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 25, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -6, scale: 1.03 }}
      onMouseMove={handleMouseMove}
      className={`stat-card-enhanced ${stat.bg} p-2 sm:p-3 md:p-4 rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4 group`}
      style={{
        "--mouse-x": `${mousePos.x}%`,
        "--mouse-y": `${mousePos.y}%`,
        "--stat-color": stat.color.replace("text-", "").includes("red")
          ? "rgb(239 68 68)"
          : stat.color.includes("blue")
          ? "rgb(59 130 246)"
          : stat.color.includes("orange")
          ? "rgb(249 115 22)"
          : "rgb(34 197 94)",
      } as React.CSSProperties}
    >
      <motion.div
        className={`stat-icon-container p-2 sm:p-2.5 rounded-md bg-black/50 border border-white/10 ${stat.glow} shrink-0 relative`}
        whileHover={{ rotate: [-5, 5, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className={`stat-icon w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 ${stat.color}`} />
        {/* Pulse ring on hover */}
        <div className="pulse-ring opacity-0 group-hover:opacity-100" style={{ borderColor: "currentColor" }} />
      </motion.div>
      <div className="text-center sm:text-left">
        <div className="text-xs text-muted-foreground font-display uppercase font-bold tracking-widest">
          {stat.label}
        </div>
        <motion.div
          className="text-lg sm:text-xl md:text-xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          <AnimatedNumber value={stat.value} />
        </motion.div>
      </div>
    </motion.div>
  );
}
// ─── Enhanced Quest Card ───
function QuestCard({ quest, index }: { quest: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.6 + index * 0.07, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="quest-card-enhanced bg-black/40 p-3 sm:p-4 rounded-lg border border-white/5 group cursor-pointer"
      data-difficulty={quest.difficulty}
    >
      <div className="font-bold text-sm text-white mb-2 line-clamp-2 group-hover:text-primary/90 transition-colors duration-300">
        {quest.title}
      </div>
      <div className="flex justify-between items-center text-xs font-display uppercase tracking-widest gap-2">
        <motion.span
          whileHover={{ scale: 1.1 }}
          className={`font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
            quest.difficulty === "hard"
              ? "text-red-400 bg-red-500/10"
              : quest.difficulty === "medium"
              ? "text-orange-400 bg-orange-500/10"
              : "text-green-400 bg-green-500/10"
          }`}
        >
          {quest.difficulty}
        </motion.span>
        <span className="text-secondary font-bold drop-shadow-[0_0_4px_hsl(var(--secondary)/0.5)] flex items-center gap-1">
          <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          +{quest.xpReward} XP
        </span>
      </div>
    </motion.div>
  );
}
export default function Dashboard() {
  const [rewardPopupOpen, setRewardPopupOpen] = useState(false);
  const [rewardData, setRewardData] = useState<{ xpAwarded: number; crystalsAwarded: number; loginStreak: number } | null>(null);
  const [showXpGain, setShowXpGain] = useState(false);
  const { data: profile, isLoading: profileLoading } = useGetProfile({ query: { queryKey: ["/api/users/profile"] } });
  const { data: summary, isLoading: summaryLoading } = useGetStatsSummary({ query: { queryKey: ["/api/stats/summary"] } });
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyStats({ query: { queryKey: ["/api/stats/weekly"] } });
  const { data: quests, isLoading: questsLoading } = useGetQuests({ completed: false }, { query: { queryKey: ["/api/quests", { completed: false }] } });
  // Handle daily login check-in
  useEffect(() => {
    const handleCheckIn = async () => {
      try {
        const response = await customFetch("/api/users/check-in", { method: "POST" });
        const data = response as { alreadyClaimed: boolean; xpAwarded: number; crystalsAwarded: number; loginStreak: number };
        if (!data.alreadyClaimed) {
          setRewardData({
            xpAwarded: data.xpAwarded,
            crystalsAwarded: data.crystalsAwarded,
            loginStreak: data.loginStreak,
          });
          setRewardPopupOpen(true);
        }
      } catch (err) {
        console.error("Check-in failed:", err);
      }
    };
    handleCheckIn();
  }, []);
  // XP gain effect when closing reward popup
  const handleCloseReward = () => {
    setRewardPopupOpen(false);
    if (rewardData) {
      setShowXpGain(true);
      setTimeout(() => setShowXpGain(false), 1300);
    }
  };
  if (profileLoading || summaryLoading || weeklyLoading || questsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-primary font-display uppercase tracking-widest text-xl"
        >
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Synchronizing Data...
          </motion.span>
        </motion.div>
      </div>
    );
  }
  if (!profile || !summary) return null;
  const rank = getRank(profile.level);
  const nextRank = getNextRank(profile.level);
  const stats = [
    { label: "Strength", value: profile.stats.strength, icon: Sword, color: "text-red-500", glow: "shadow-[0_0_15px_rgba(239,68,68,0.5)]", bg: "bg-red-500/10" },
    { label: "Intelligence", value: profile.stats.intelligence, icon: Brain, color: "text-blue-500", glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]", bg: "bg-blue-500/10" },
    { label: "Discipline", value: profile.stats.discipline, icon: Flame, color: "text-orange-500", glow: "shadow-[0_0_15px_rgba(249,115,22,0.5)]", bg: "bg-orange-500/10" },
    { label: "Health", value: profile.stats.health, icon: Heart, color: "text-green-500", glow: "shadow-[0_0_15px_rgba(34,197,94,0.5)]", bg: "bg-green-500/10" },
  ];
  const heatmap = buildHeatmap(weekly);
  const loginStreak = (profile as any)?.loginStreak ?? 0;
  return (
    <div className="dashboard-container space-y-8 relative">
      {/* Ambient Background */}
      <div className="dashboard-ambient">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      {/* Daily Reward Popup */}
      {rewardData && (
        <DailyRewardPopup
          isOpen={rewardPopupOpen}
          onClose={handleCloseReward}
          xpAwarded={rewardData.xpAwarded}
          crystalsAwarded={rewardData.crystalsAwarded}
          loginStreak={rewardData.loginStreak}
        />
      )}
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4 relative z-10"
      >
        <div className="min-w-0">
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-widest break-words"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Player Status
          </motion.h1>
          <motion.p
            className="text-muted-foreground font-display tracking-widest uppercase text-xs sm:text-sm mt-1 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span
              className="inline-block w-2 h-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            System Initialization Complete
          </motion.p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          <StreakCounter loginStreak={loginStreak} lastLoginDate={(profile as any)?.lastLoginDate ?? null} />
          <motion.div
            className="glass-panel px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-secondary/20 flex flex-col items-center justify-center"
            whileHover={{ scale: 1.05, borderColor: "rgba(34,197,94,0.4)" }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <span className="text-xs font-bold font-display uppercase tracking-widest whitespace-nowrap">Today</span>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-secondary flex items-center gap-1 sm:gap-2" style={{ textShadow: "0 0 8px hsl(var(--secondary)/0.5)" }}>
              <Target className="w-4 sm:w-5 h-4 sm:h-5" />
              <AnimatedNumber value={summary.questsCompletedToday} duration={0.8} />
            </div>
          </motion.div>
        </div>
      </motion.header>
      {/* ── Player Card (Main) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel glass-panel-enhanced player-card p-4 sm:p-6 md:p-8 rounded-xl border border-primary/20 relative overflow-hidden"
      >
        {/* XP Gain Effect */}
        <XpGainEffect show={showXpGain} amount={rewardData?.xpAwarded ?? 50} />
        {/* Background decoration */}
        <motion.div
          className="absolute top-0 right-0 p-4 sm:p-8 pointer-events-none"
          animate={{ opacity: [0.02, 0.05, 0.02], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <Activity className="w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 text-white" />
        </motion.div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8 relative z-10">
          {/* Rank Diamond */}
          <motion.div
            whileHover={{ scale: 1.08, rotate: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rank-diamond w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-none rotate-45 bg-primary/10 border-2 border-primary/50 flex items-center justify-center glow-box shrink-0"
          >
            <div className="-rotate-45 text-center">
              <div className="text-xs font-display text-primary uppercase font-bold tracking-widest mb-0.5 sm:mb-1 flex items-center justify-center gap-1">
                <Crown className="w-3 h-3" />
                Rank
              </div>
              <motion.div
                key={profile.level}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              >
                {profile.level}
              </motion.div>
            </div>
          </motion.div>
          <div className="flex-1 w-full space-y-3 sm:space-y-4 pt-0 md:pt-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 sm:gap-3 text-center sm:text-left">
              <div>
                <span className="text-lg sm:text-xl md:text-2xl font-display uppercase font-bold tracking-wider text-white break-words">
                  {profile.username}
                </span>
                <motion.div
                  className={`text-xs sm:text-sm font-display uppercase tracking-widest font-bold ${rank.color} flex items-center gap-1.5 justify-center sm:justify-start`}
                  style={{ textShadow: `0 0 8px ${rank.glowColor}` }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Shield className="w-3 h-3" />
                  {rank.title}
                </motion.div>
              </div>
              <motion.span
                className="text-sm sm:text-base md:text-lg text-primary font-display uppercase font-bold tracking-widest whitespace-nowrap"
                animate={{ textShadow: ["0 0 5px hsl(var(--primary)/0.3)", "0 0 15px hsl(var(--primary)/0.6)", "0 0 5px hsl(var(--primary)/0.3)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AnimatedNumber value={profile.xp} /> / {(profile.xp + profile.xpToNextLevel).toLocaleString()} XP
              </motion.span>
            </div>
            {/* XP Bar */}
            <div className="space-y-2">
              <div className="xp-bar-container h-4 sm:h-5 bg-black/60 rounded-full overflow-hidden border border-border relative group">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.xpProgress}%` }}
                  transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                  className="xp-bar-fill absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full"
                >
                  <div className="xp-bar-edge" />
                </motion.div>
                <div className="xp-bar-shimmer" />
                {/* Percentage on hover */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-display font-bold tracking-widest text-white/0 group-hover:text-white/80 transition-colors duration-300"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {summary.xpProgress}%
                </motion.div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs font-display uppercase tracking-widest">
                <span className="text-muted-foreground">{profile.xpToNextLevel.toLocaleString()} XP to Next Rank</span>
                {nextRank && (
                  <motion.span
                    className={`${nextRank.info.color} font-bold flex items-center gap-1`}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ChevronRight className="w-3 h-3" />
                    Next: {nextRank.info.title} (Lv.{nextRank.levelRequired})
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8 md:mt-8 pt-6 sm:pt-8 md:pt-8 border-t border-border relative z-10">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </motion.div>
      {/* ── Streak Heatmap + Chart Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 glass-panel glass-panel-enhanced p-4 sm:p-6 rounded-xl border border-border flex flex-col chart-container"
        >
          <h2 className="text-base sm:text-lg md:text-lg font-display font-bold text-white uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
              <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            </motion.div>
            Combat Log (7 Days)
          </h2>
          <div className="flex-1 min-h-[200px] sm:min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
                <XAxis dataKey="dayLabel" stroke="#666" tick={{ fontFamily: "Rajdhani", fontSize: 12, fill: "#666" }} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fontFamily: "Rajdhani", fontSize: 12, fill: "#666" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10,10,15,0.95)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    borderRadius: "12px",
                    fontFamily: "Rajdhani",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                  itemStyle={{ color: "#00d4ff", fontWeight: "bold" }}
                  cursor={{ stroke: "rgba(0,212,255,0.2)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="xpEarned"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorXp)"
                  filter="url(#glow)"
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "rgba(0,212,255,0.3)", strokeWidth: 8 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        {/* ── Streak Heatmap ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel glass-panel-enhanced p-4 sm:p-6 rounded-xl border border-border flex flex-col"
        >
          <h2 className="text-base sm:text-lg md:text-lg font-display font-bold text-white uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-secondary" />
            </motion.div>
            Activity (28 Days)
          </h2>
          <div className="grid grid-cols-7 gap-1 flex-1 content-start">
            {heatmap.map((cell, i) => (
              <motion.div
                key={cell.date}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.012, type: "spring", stiffness: 500, damping: 30 }}
                className={`heatmap-cell-enhanced aspect-square rounded-sm border ${getHeatColor(cell.xp)} relative group cursor-default text-xs`}
              >
                {/* Tooltip on hover */}
                <div className="heatmap-tooltip px-2.5 py-1.5 bg-black/95 border border-border rounded-md text-[10px] font-display uppercase tracking-widest text-white whitespace-nowrap shadow-lg">
                  <span className="text-primary font-bold">{cell.xp} XP</span>
                  <div className="text-muted-foreground text-[9px]">{cell.date}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-display uppercase tracking-widest">Less</span>
            <div className="flex gap-0.5 sm:gap-1">
              {["bg-white/[0.03]", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80"].map((c, i) => (
                <motion.div key={i} className={`w-2 sm:w-3 h-2 sm:h-3 rounded-sm ${c} border border-white/10`} whileHover={{ scale: 1.5 }} />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-display uppercase tracking-widest">More</span>
          </div>
        </motion.div>
      </div>
      {/* ── Quick Stats + Active Quests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel glass-panel-enhanced p-4 sm:p-6 rounded-xl border border-border"
        >
          <h2 className="text-base sm:text-lg font-display font-bold text-white uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Overview
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { label: "Total Quests Completed", value: summary.totalQuestsCompleted, color: "text-secondary", icon: Target },
              { label: "Pending Quests", value: summary.totalQuestsPending, color: "text-orange-400", icon: Sword },
              { label: "Longest Streak", value: summary.longestStreak, suffix: " Days", color: "text-red-400", icon: Flame },
              { label: "Total XP Earned", value: summary.totalXpEarned, color: "text-primary", icon: Zap },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="overview-row flex justify-between items-center py-2 border-b border-white/5 last:border-0 rounded cursor-default"
              >
                <span className="text-xs sm:text-xs text-muted-foreground font-display uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <item.icon className="row-icon w-3 h-3" />
                  {item.label}
                </span>
                <span className={`row-value text-base sm:text-lg font-bold font-display break-words text-right ml-2 ${item.color}`}>
                  {typeof item.value === "number" ? <AnimatedNumber value={item.value} /> : item.value}
                  {item.suffix || ""}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* Active Quests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-panel glass-panel-enhanced p-4 sm:p-6 rounded-xl border border-border flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-display font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Sword className="w-4 h-4 text-primary" />
              Active Quests
            </h2>
            <Link href="/quests">
              <motion.span
                className="view-all-btn text-xs text-primary hover:text-white transition-colors font-display uppercase tracking-widest px-3 py-1.5 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 whitespace-nowrap inline-flex items-center gap-1 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View All
                <ChevronRight className="chevron w-3 h-3" />
              </motion.span>
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 overflow-y-auto">
            {quests && quests.length > 0 ? (
              quests.slice(0, 6).map((quest, i) => <QuestCard key={quest.id} quest={quest} index={i} />)
            ) : (
              <motion.div
                className="col-span-full flex flex-col items-center justify-center py-8 sm:py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center space-y-3 sm:space-y-4">
                  <motion.div
                    className="empty-quest-icon mx-auto w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-1 sm:mb-2"
                    animate={{ boxShadow: ["0 0 20px hsl(var(--primary)/0.1)", "0 0 40px hsl(var(--primary)/0.25)", "0 0 20px hsl(var(--primary)/0.1)"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Zap className="empty-quest-zap w-6 sm:w-8 h-6 sm:h-8 text-primary opacity-80" />
                    </motion.div>
                  </motion.div>
                  <h3 className="text-white font-display font-bold uppercase tracking-widest text-base sm:text-lg">No Active Quests</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-[250px] mx-auto pb-2">
                    Your quest log is empty. Are you ready to forge new tasks for today?
                  </p>
                  <GenerateQuestsButton />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}