import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { Trophy, Shield, Activity, LogOut, Menu, X, Flame, Zap, Sparkles } from "lucide-react";
import { useGetProfile, useGetStatsSummary } from "../lib/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRank } from "../lib/ranks";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: profile } = useGetProfile({ query: { queryKey: ["/api/users/profile"] } });
  const { data: summary } = useGetStatsSummary({ query: { queryKey: ["/api/stats/summary"] } });

  const rank = getRank(profile?.level ?? 1);

  const logout = () => {
    localStorage.removeItem("levelup_token");
    setLocation("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Status", icon: Activity },
    { href: "/quests", label: "Quests", icon: Shield },
    { href: "/leaderboard", label: "Rankings", icon: Trophy },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 hidden md:block">
        <h1 className="text-3xl font-bold font-display tracking-wider text-primary glow-text uppercase">LevelUp</h1>
      </div>
      
      {/* ── Player Card ── */}
      <div className="px-4 py-4 mb-2">
        <div className="glass-panel rounded-xl p-4 border border-primary/10 relative overflow-hidden">
          <div className="shimmer absolute inset-0 rounded-xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-none rotate-45 bg-primary/20 border-2 border-primary/50 flex items-center justify-center glow-box overflow-hidden shrink-0">
               <div className="-rotate-45 font-display font-bold text-primary text-xl">{profile?.level || 1}</div>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm tracking-wide text-white uppercase truncate">{profile?.username || "Player"}</div>
              <div className={`text-xs font-display uppercase tracking-widest font-bold ${rank.color} rank-badge`} style={{ textShadow: `0 0 6px ${rank.glowColor}` }}>
                {rank.title}
              </div>
            </div>
          </div>

          {/* ── Persistent XP Bar ── */}
          <div className="mt-4 relative z-10">
            <div className="flex justify-between text-[10px] font-display uppercase tracking-widest mb-1.5">
              <span className="text-muted-foreground font-bold">XP</span>
              <span className="text-primary font-bold">
                {profile?.xp ?? 0} / {(profile?.xp ?? 0) + (profile?.xpToNextLevel ?? 100)}
              </span>
            </div>
            <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-border relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${summary?.xpProgress ?? 0}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-cyan-300 xp-bar-glow rounded-full"
              />
            </div>
          </div>

          {/* ── Streak Indicator ── */}
          {(summary?.currentStreak ?? 0) > 0 && (
            <div className="mt-3 flex items-center gap-2 relative z-10">
              <Flame className="w-4 h-4 text-orange-500 streak-flame" />
              <span className="text-xs font-display uppercase tracking-widest text-orange-400 font-bold">
                {summary?.currentStreak} Day Streak
              </span>
              {(summary?.currentStreak ?? 0) >= 7 && (
                <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const active = location === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 font-display uppercase tracking-wider font-bold ${active ? 'bg-primary/10 text-primary border border-primary/30 glow-box' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border/50">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-display uppercase tracking-wider font-bold">
          <LogOut className="w-5 h-5" />
          <span>Disconnect</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden font-sans relative">
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 border-b border-border glass-panel z-40 flex items-center justify-between px-4">
        <h1 className="text-xl font-bold font-display tracking-wider text-primary glow-text uppercase">LevelUp</h1>
        <div className="flex items-center gap-3">
          {/* Mobile XP mini-bar */}
          {profile && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-display text-primary font-bold">Lv.{profile.level}</span>
              <div className="w-16 h-1.5 bg-black/60 rounded-full overflow-hidden border border-border">
                <motion.div
                  animate={{ width: `${summary?.xpProgress ?? 0}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col relative z-30 glass-panel">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-64 border-r border-border bg-background flex md:hidden flex-col z-50 glass-panel pt-16 shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-auto relative pt-16 md:pt-0">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none z-0" />
        <div className="fixed inset-0 bg-[url('/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0" />
        <div className="relative z-10 h-full p-4 md:p-10 max-w-7xl mx-auto pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
