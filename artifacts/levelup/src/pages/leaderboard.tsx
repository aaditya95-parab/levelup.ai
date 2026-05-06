import { useGetLeaderboard } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Medal } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ query: { queryKey: ["/api/stats/leaderboard"] } });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center mb-12">
        <Trophy className="w-20 h-20 mx-auto text-primary mb-6 animate-pulse drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]" />
        <h1 className="text-5xl font-display font-bold text-white uppercase tracking-widest glow-text">Rankings</h1>
        <p className="text-muted-foreground font-display tracking-widest uppercase mt-3 text-sm">Top Operatives Globally</p>
      </header>

      <div className="space-y-4 relative">
        <AnimatePresence>
          {isLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-primary font-display uppercase tracking-widest animate-pulse py-12 text-xl">
              Fetching Ladder Data...
            </motion.div>
          ) : (
            leaderboard?.map((player, index) => {
              const Icon = index === 0 ? Crown : index === 1 ? Medal : index === 2 ? Medal : undefined;
              
              return (
                <motion.div
                  key={player.username}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                  className={`glass-panel p-4 md:p-6 rounded-xl border flex flex-col md:flex-row md:items-center gap-4 md:gap-8 transition-all hover:bg-white/[0.02] ${
                    index === 0 ? 'border-primary/50 bg-primary/10 shadow-[0_0_30px_hsl(var(--primary)/0.15)] transform md:scale-[1.02] z-10 relative' : 
                    index === 1 ? 'border-secondary/40 bg-secondary/5' : 
                    index === 2 ? 'border-orange-500/30 bg-orange-500/5' : 
                    'border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4 md:gap-8">
                    <div className={`w-12 text-center font-display font-bold text-4xl ${
                      index === 0 ? 'text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]' : 
                      index === 1 ? 'text-secondary drop-shadow-[0_0_10px_hsl(var(--secondary)/0.5)]' : 
                      index === 2 ? 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'text-muted-foreground/50'
                    }`}>
                      #{index + 1}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className={`w-8 h-8 ${
                        index === 0 ? 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]' : 
                        index === 1 ? 'text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary)/0.8)]' : 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                      }`} />}
                      <span className={`text-2xl font-bold tracking-wide font-display uppercase ${index === 0 ? 'text-white' : 'text-white/90'}`}>{player.username}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-3 gap-4 items-center text-center md:text-right mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="flex flex-col md:items-end">
                      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mb-1">Rank</div>
                      <div className="text-3xl font-display font-bold text-white">{player.level}</div>
                    </div>
                    <div className="flex flex-col md:items-end">
                      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mb-1">Streak</div>
                      <div className="text-2xl font-bold text-orange-500">{player.streak}</div>
                    </div>
                    <div className="flex flex-col md:items-end">
                      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mb-1">Total XP</div>
                      <div className="text-xl font-bold text-secondary font-display tracking-wider">{player.xp.toLocaleString()}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
