import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { Trophy, Shield, Activity, LogOut, Menu, X } from "lucide-react";
import { useGetProfile } from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: profile } = useGetProfile({ query: { queryKey: ["/api/users/profile"] } });

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
      
      <div className="px-4 py-6 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-none rotate-45 bg-primary/20 border border-primary/50 flex items-center justify-center glow-box overflow-hidden">
           <div className="-rotate-45 font-display font-bold text-primary">{profile?.level || 1}</div>
        </div>
        <div>
          <div className="font-bold text-sm tracking-wide text-white uppercase">{profile?.username || "Player"}</div>
          <div className="text-xs text-primary font-display uppercase tracking-widest">Rank {profile?.level || 1}</div>
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
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
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
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0" />
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
