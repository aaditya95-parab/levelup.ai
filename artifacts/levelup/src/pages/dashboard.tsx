import { useGetProfile, useGetStatsSummary, useGetWeeklyStats, useGetQuests } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Flame, Sword, Brain, Activity, Heart, Calendar } from "lucide-react";
import { Link } from "wouter";

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

  const stats = [
    { label: "Strength", value: profile.stats.strength, icon: Sword, color: "text-red-500", glow: "shadow-[0_0_15px_rgba(239,68,68,0.5)]" },
    { label: "Intelligence", value: profile.stats.intelligence, icon: Brain, color: "text-blue-500", glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]" },
    { label: "Discipline", value: profile.stats.discipline, icon: Flame, color: "text-orange-500", glow: "shadow-[0_0_15px_rgba(249,115,22,0.5)]" },
    { label: "Health", value: profile.stats.health, icon: Heart, color: "text-green-500", glow: "shadow-[0_0_15px_rgba(34,197,94,0.5)]" },
  ];

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
              <Flame className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> {summary.currentStreak} Days
            </div>
          </div>
        </div>
      </header>

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
          
          <div className="flex-1 w-full space-y-6 pt-2">
            <div className="flex justify-between items-end font-display uppercase font-bold tracking-widest">
              <span className="text-2xl text-white tracking-wider">{profile.username}</span>
              <span className="text-primary">{profile.xp} / {profile.xp + profile.xpToNextLevel} XP</span>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-border relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.xpProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  className="absolute top-0 left-0 h-full bg-primary glow-box"
                />
              </div>
              <div className="text-right text-xs text-muted-foreground font-display uppercase tracking-widest">
                {profile.xpToNextLevel} XP to Next Rank
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border relative z-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="bg-black/40 p-4 rounded-lg border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors"
              >
                <div className={`p-2 rounded-md bg-black/50 border border-white/10 ${stat.glow}`}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2 glass-panel p-6 rounded-xl border border-border flex flex-col"
        >
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-widest mb-6">Combat Log (7 Days)</h2>
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

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 rounded-xl border border-border flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-widest">Active Quests</h2>
            <Link href="/quests" className="text-xs text-primary hover:text-white transition-colors font-display uppercase tracking-widest px-2 py-1 rounded bg-primary/10 border border-primary/20">View All</Link>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            {quests && quests.length > 0 ? (
              quests.slice(0, 4).map((quest, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1) }}
                  key={quest.id} 
                  className="bg-black/40 p-4 rounded-lg border border-white/5 hover:border-primary/30 transition-all group hover:bg-black/60 cursor-pointer"
                >
                  <div className="font-bold text-sm text-white mb-2 line-clamp-1">{quest.title}</div>
                  <div className="flex justify-between items-center text-xs font-display uppercase tracking-widest">
                    <span className="text-muted-foreground">{quest.category}</span>
                    <span className="text-secondary font-bold">+{quest.xpReward} XP</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <Calendar className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-display uppercase tracking-widest">No Active Quests</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
