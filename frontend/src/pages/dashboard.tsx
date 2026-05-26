import { useGetProfile, useGetStatsSummary, useGetWeeklyStats, useGetQuests } from "../lib/api-client-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Flame, Sword, Brain, Activity, Heart, Calendar, TrendingUp, Target, Zap } from "lucide-react";
import { Link } from "wouter";
import { getRank, getNextRank } from "../lib/ranks";
import { StreakCounter } from "../components/StreakCounter";
import { DailyRewardPopup } from "../components/DailyRewardPopup";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../lib/api-client-react/custom-fetch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-lg font-display uppercase font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm active:scale-95"
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
    </button>
  );
}

export default function Dashboard() {
  const [rewardPopupOpen, setRewardPopupOpen] = useState(false);
  const [rewardData, setRewardData] = useState<{ xpAwarded: number; crystalsAwarded: number; loginStreak: number } | null>(null);
  
  const { data: profile, isLoading: profileLoading } = useGetProfile({ query: { queryKey: ["/api/users/profile"] } });
  const { data: summary, isLoading: summaryLoading } = useGetStatsSummary({ query: { queryKey: ["/api/stats/summary"] } });
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyStats({ query: { queryKey: ["/api/stats/weekly"] } });
  const { data: quests, isLoading: questsLoading } = useGetQuests({ completed: false }, { query: { queryKey: ["/api/quests", { completed: false }] } });

  // Handle daily login check-in
  useEffect(() => {
    const handleCheckIn = async () => {
      try {
        const response = await customFetch("/api/users/check-in", { method: "POST" });
        if (!response.alreadyClaimed) {
          setRewardData({
            xpAwarded: response.xpAwarded,
            crystalsAwarded: response.crystalsAwarded,
            loginStreak: response.loginStreak,
          });
          setRewardPopupOpen(true);
        }
      } catch (err) {
        console.error("Check-in failed:", err);
      }
    };

    handleCheckIn();
  }, []);

  if (profileLoading || summaryLoading || weeklyLoading || questsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-primary font-display uppercase tracking-widest text-xl animate-pulse">Synchronizing Data...</div>
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

  return (
    <div className="space-y-8">
      {/* Daily Reward Popup */}
      {rewardData && (
        <DailyRewardPopup
          isOpen={rewardPopupOpen}
          onClose={() => setRewardPopupOpen(false)}
          xpAwarded={rewardData.xpAwarded}
          crystalsAwarded={rewardData.crystalsAwarded}
          loginStreak={rewardData.loginStreak}
        />
      )}

      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-widest break-words">Player Status</h1>
          <p className="text-muted-foreground font-display tracking-widest uppercase text-xs sm:text-sm mt-1">System Initialization Complete</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          <StreakCounter loginStreak={profile?.loginStreak ?? 0} lastLoginDate={profile?.lastLoginDate ?? null} />
          <div className="glass-panel px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-secondary/20 flex flex-col items-center justify-center">
            <span className="text-xs font-bold font-display uppercase tracking-widest whitespace-nowrap">Today</span>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-secondary flex items-center gap-1 sm:gap-2" style={{ textShadow: '0 0 8px hsl(var(--secondary)/0.5)' }}>
              <Target className="w-4 sm:w-5 h-4 sm:h-5" /> {summary.questsCompletedToday}
            </div>
          </div>
        </div>
      </header>

      {/* ── Player Card (Main) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4 sm:p-6 md:p-8 rounded-xl border border-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-[0.03] pointer-events-none">
          <Activity className="w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 text-white" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-8 relative z-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-none rotate-45 bg-primary/10 border-2 border-primary/50 flex items-center justify-center glow-box shrink-0">
            <div className="-rotate-45 text-center">
              <div className="text-xs font-display text-primary uppercase font-bold tracking-widest mb-0.5 sm:mb-1">Rank</div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{profile.level}</div>
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-3 sm:space-y-4 pt-0 md:pt-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 sm:gap-3 text-center sm:text-left">
              <div>
                <span className="text-lg sm:text-xl md:text-2xl font-display uppercase font-bold tracking-wider text-white break-words">{profile.username}</span>
                <div className={`text-xs sm:text-sm font-display uppercase tracking-widest font-bold ${rank.color}`} style={{ textShadow: `0 0 8px ${rank.glowColor}` }}>
                  {rank.title}
                </div>
              </div>
              <span className="text-sm sm:text-base md:text-lg text-primary font-display uppercase font-bold tracking-widest whitespace-nowrap">{profile.xp} / {profile.xp + profile.xpToNextLevel} XP</span>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 sm:h-5 bg-black/60 rounded-full overflow-hidden border border-border relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.xpProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-cyan-400 to-primary xp-bar-glow rounded-full"
                />
                <div className="absolute inset-0 shimmer rounded-full pointer-events-none" />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs font-display uppercase tracking-widest">
                <span className="text-muted-foreground">{profile.xpToNextLevel} XP to Next Rank</span>
                {nextRank && (
                  <span className={`${nextRank.info.color} font-bold`}>
                    Next: {nextRank.info.title} (Lv.{nextRank.levelRequired})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8 md:mt-8 pt-6 sm:pt-8 md:pt-8 border-t border-border relative z-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className={`${stat.bg} p-2 sm:p-3 md:p-4 rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] group`}
              >
                <div className={`p-2 sm:p-2.5 rounded-md bg-black/50 border border-white/10 ${stat.glow} group-hover:scale-110 transition-transform shrink-0`}>
                  <Icon className={`w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 ${stat.color}`} />
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-muted-foreground font-display uppercase font-bold tracking-widest">{stat.label}</div>
                  <div className="text-lg sm:text-xl md:text-xl font-bold text-white">{stat.value}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Streak Heatmap + Chart Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-panel p-4 sm:p-6 rounded-xl border border-border flex flex-col"
        >
          <h2 className="text-base sm:text-lg md:text-lg font-display font-bold text-white uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-primary" /> Combat Log (7 Days)
          </h2>
          <div className="flex-1 min-h-[200px] sm:min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="dayLabel" stroke="#666" tick={{fontFamily: 'Rajdhani', fontSize: window.innerWidth < 640 ? 10 : 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{fontFamily: 'Rajdhani', fontSize: window.innerWidth < 640 ? 10 : 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}
                  itemStyle={{ color: '#00d4ff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="xpEarned" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorXp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Streak Heatmap ── */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel p-4 sm:p-6 rounded-xl border border-border flex flex-col"
        >
          <h2 className="text-base sm:text-lg md:text-lg font-display font-bold text-white uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
            <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-secondary" /> Activity (28 Days)
          </h2>
          <div className="grid grid-cols-7 gap-1 flex-1 content-start">
            {heatmap.map((cell, i) => (
              <div
                key={cell.date}
                className={`heatmap-cell aspect-square rounded-sm border ${getHeatColor(cell.xp)} relative group cursor-default text-xs`}
                title={`${cell.date}: ${cell.xp} XP`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-black/95 border border-border rounded text-[10px] font-display uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  {cell.xp} XP
                  <div className="text-muted-foreground text-[9px]">{cell.date}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-display uppercase tracking-widest">Less</span>
            <div className="flex gap-0.5 sm:gap-1">
              {["bg-white/[0.03]", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80"].map((c, i) => (
                <div key={i} className={`w-2 sm:w-3 h-2 sm:h-3 rounded-sm ${c} border border-white/10`} />
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
          transition={{ delay: 0.5 }}
          className="glass-panel p-4 sm:p-6 rounded-xl border border-border"
        >
          <h2 className="text-base sm:text-lg font-display font-bold text-white uppercase tracking-widest mb-4 sm:mb-6">Overview</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { label: "Total Quests Completed", value: summary.totalQuestsCompleted, color: "text-secondary" },
              { label: "Pending Quests", value: summary.totalQuestsPending, color: "text-orange-400" },
              { label: "Longest Streak", value: `${summary.longestStreak} Days`, color: "text-red-400" },
              { label: "Total XP Earned", value: summary.totalXpEarned.toLocaleString(), color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-xs sm:text-xs text-muted-foreground font-display uppercase tracking-widest font-bold">{item.label}</span>
                <span className={`text-base sm:text-lg font-bold font-display break-words text-right ml-2 ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active Quests */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2 glass-panel p-4 sm:p-6 rounded-xl border border-border flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-display font-bold text-white uppercase tracking-widest">Active Quests</h2>
            <Link href="/quests" className="text-xs text-primary hover:text-white transition-colors font-display uppercase tracking-widest px-3 py-1.5 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 whitespace-nowrap">View All</Link>
          </div>
          
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 overflow-y-auto">
            {quests && quests.length > 0 ? (
              quests.slice(0, 6).map((quest, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (i * 0.07) }}
                  key={quest.id} 
                  className="bg-black/40 p-3 sm:p-4 rounded-lg border border-white/5 hover:border-primary/30 transition-all group hover:bg-black/60 cursor-pointer active:scale-95"
                >
                  <div className="font-bold text-sm text-white mb-2 line-clamp-2">{quest.title}</div>
                  <div className="flex justify-between items-center text-xs font-display uppercase tracking-widest gap-2">
                    <span className={`font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                      quest.difficulty === 'hard' ? 'text-red-400 bg-red-500/10' :
                      quest.difficulty === 'medium' ? 'text-orange-400 bg-orange-500/10' :
                      'text-green-400 bg-green-500/10'
                    }`}>{quest.difficulty}</span>
                    <span className="text-secondary font-bold drop-shadow-[0_0_4px_hsl(var(--secondary)/0.5)]">+{quest.xpReward} XP</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-6">
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="mx-auto w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-1 sm:mb-2">
                    <Zap className="w-6 sm:w-8 h-6 sm:h-8 text-primary opacity-80" />
                  </div>
                  <h3 className="text-white font-display font-bold uppercase tracking-widest text-base sm:text-lg">No Active Quests</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-[250px] mx-auto pb-2">
                    Your quest log is empty. Are you ready to forge new tasks for today?
                  </p>
                  
                  <GenerateQuestsButton />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
