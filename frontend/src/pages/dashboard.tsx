import { useGetProfile, useGetStatsSummary, useGetWeeklyStats, useGetQuests } from "../lib/api-client-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Flame, Sword, Brain, Activity, Heart, Calendar, TrendingUp, Target, Zap } from "lucide-react";
import { Link } from "wouter";
import { getRank, getNextRank } from "../lib/ranks";

import { useState } from "react";
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
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-lg font-display uppercase font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ boxShadow: "0 0 20px hsl(var(--primary)/0.2)" }}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Forging...
        </>
      ) : (
        <>
          <Sword className="w-5 h-5" />
          Forge Today's Quests
        </>
      )}
    </button>
  );
}

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useGetProfile({ query: { queryKey: ["/api/users/profile"] } });
  const { data: summary, isLoading: summaryLoading } = useGetStatsSummary({ query: { queryKey: ["/api/stats/summary"] } });
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyStats({ query: { queryKey: ["/api/stats/weekly"] } });
  const { data: quests, isLoading: questsLoading } = useGetQuests({ completed: false }, { query: { queryKey: ["/api/quests", { completed: false }] } });

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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-widest">Player Status</h1>
          <p className="text-muted-foreground font-display tracking-widest uppercase text-sm mt-1">System Initialization Complete</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-3 rounded-lg border border-primary/20 flex flex-col items-center">
            <span className="text-xs text-muted-foreground font-bold font-display uppercase tracking-widest">Current Streak</span>
            <div className="text-2xl font-bold text-primary flex items-center gap-2 glow-text">
              <Flame className="w-5 h-5 text-orange-500 streak-flame" /> {summary.currentStreak} Days
            </div>
          </div>
          <div className="glass-panel px-6 py-3 rounded-lg border border-secondary/20 flex flex-col items-center">
            <span className="text-xs text-muted-foreground font-bold font-display uppercase tracking-widest">Today</span>
            <div className="text-2xl font-bold text-secondary flex items-center gap-2" style={{ textShadow: '0 0 8px hsl(var(--secondary)/0.5)' }}>
              <Target className="w-5 h-5" /> {summary.questsCompletedToday}
            </div>
          </div>
        </div>
      </header>

      {/* ── Player Card (Main) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-xl border border-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Activity className="w-64 h-64 text-white" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-32 h-32 rounded-none rotate-45 bg-primary/10 border-2 border-primary/50 flex items-center justify-center glow-box mt-4 md:mt-0 shrink-0">
            <div className="-rotate-45 text-center">
              <div className="text-xs font-display text-primary uppercase font-bold tracking-widest mb-1">Rank</div>
              <div className="text-5xl font-display font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{profile.level}</div>
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-4 pt-2">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
              <div>
                <span className="text-2xl font-display uppercase font-bold tracking-wider text-white">{profile.username}</span>
                <div className={`text-sm font-display uppercase tracking-widest font-bold ${rank.color}`} style={{ textShadow: `0 0 8px ${rank.glowColor}` }}>
                  {rank.title}
                </div>
              </div>
              <span className="text-primary font-display uppercase font-bold tracking-widest">{profile.xp} / {profile.xp + profile.xpToNextLevel} XP</span>
            </div>
            
            <div className="space-y-2">
              <div className="h-5 bg-black/60 rounded-full overflow-hidden border border-border relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.xpProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-cyan-400 to-primary xp-bar-glow rounded-full"
                />
                <div className="absolute inset-0 shimmer rounded-full pointer-events-none" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-display uppercase tracking-widest">
                <span>{profile.xpToNextLevel} XP to Next Rank</span>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border relative z-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className={`${stat.bg} p-4 rounded-lg border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] group`}
              >
                <div className={`p-2.5 rounded-md bg-black/50 border border-white/10 ${stat.glow} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-display uppercase font-bold tracking-widest">{stat.label}</div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Streak Heatmap + Chart Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2 glass-panel p-6 rounded-xl border border-border flex flex-col"
        >
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Combat Log (7 Days)
          </h2>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="dayLabel" stroke="#666" tick={{fontFamily: 'Rajdhani', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{fontFamily: 'Rajdhani', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  itemStyle={{ color: '#00d4ff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="xpEarned" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Streak Heatmap ── */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel p-6 rounded-xl border border-border flex flex-col"
        >
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-secondary" /> Activity (28 Days)
          </h2>
          <div className="grid grid-cols-7 gap-1.5 flex-1 content-start">
            {heatmap.map((cell, i) => (
              <div
                key={cell.date}
                className={`heatmap-cell aspect-square rounded-sm border ${getHeatColor(cell.xp)} relative group cursor-default`}
                title={`${cell.date}: ${cell.xp} XP`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/95 border border-border rounded text-[10px] font-display uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  {cell.xp} XP
                  <div className="text-muted-foreground">{cell.date}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <span className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">Less</span>
            <div className="flex gap-1">
              {["bg-white/[0.03]", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80"].map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-white/10`} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">More</span>
          </div>
        </motion.div>
      </div>

      {/* ── Quick Stats + Active Quests ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 rounded-xl border border-border"
        >
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-widest mb-6">Overview</h2>
          <div className="space-y-4">
            {[
              { label: "Total Quests Completed", value: summary.totalQuestsCompleted, color: "text-secondary" },
              { label: "Pending Quests", value: summary.totalQuestsPending, color: "text-orange-400" },
              { label: "Longest Streak", value: `${summary.longestStreak} Days`, color: "text-red-400" },
              { label: "Total XP Earned", value: summary.totalXpEarned.toLocaleString(), color: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-muted-foreground font-display uppercase tracking-widest font-bold">{item.label}</span>
                <span className={`text-lg font-bold font-display ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active Quests */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="md:col-span-2 glass-panel p-6 rounded-xl border border-border flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-widest">Active Quests</h2>
            <Link href="/quests" className="text-xs text-primary hover:text-white transition-colors font-display uppercase tracking-widest px-3 py-1.5 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20">View All</Link>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
            {quests && quests.length > 0 ? (
              quests.slice(0, 6).map((quest, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (i * 0.07) }}
                  key={quest.id} 
                  className="bg-black/40 p-4 rounded-lg border border-white/5 hover:border-primary/30 transition-all group hover:bg-black/60 cursor-pointer"
                >
                  <div className="font-bold text-sm text-white mb-2 line-clamp-1">{quest.title}</div>
                  <div className="flex justify-between items-center text-xs font-display uppercase tracking-widest">
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      quest.difficulty === 'hard' ? 'text-red-400 bg-red-500/10' :
                      quest.difficulty === 'medium' ? 'text-orange-400 bg-orange-500/10' :
                      'text-green-400 bg-green-500/10'
                    }`}>{quest.difficulty}</span>
                    <span className="text-secondary font-bold drop-shadow-[0_0_4px_hsl(var(--secondary)/0.5)]">+{quest.xpReward} XP</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
                    <Zap className="w-8 h-8 text-primary opacity-80" />
                  </div>
                  <h3 className="text-white font-display font-bold uppercase tracking-widest text-lg">No Active Quests</h3>
                  <p className="text-sm text-muted-foreground max-w-[250px] mx-auto pb-2">
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
