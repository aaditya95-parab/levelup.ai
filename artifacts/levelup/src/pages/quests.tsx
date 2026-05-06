import { useState } from "react";
import { useGetQuests, useCreateQuest, useUpdateQuest, useDeleteQuest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Check, X, Filter } from "lucide-react";
import { useLevelUp } from "@/components/level-up-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";

const questSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.enum(["strength", "intelligence", "discipline", "health"]),
});

export default function Quests() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { triggerLevelUp, triggerXPGain } = useLevelUp();

  const { data: quests, isLoading } = useGetQuests(
    filter === "all" ? undefined : { completed: filter === "completed" },
    { query: { queryKey: ["/api/quests", filter === "all" ? undefined : { completed: filter === "completed" }] } }
  );

  const createQuest = useCreateQuest();
  const updateQuest = useUpdateQuest();
  const deleteQuest = useDeleteQuest();

  const form = useForm({
    resolver: zodResolver(questSchema),
    defaultValues: { title: "", description: "", difficulty: "easy" as const, category: "strength" as const }
  });

  const onCreateSubmit = (data: z.infer<typeof questSchema>) => {
    createQuest.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/summary"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/weekly"] });
        setDialogOpen(false);
        form.reset();
      }
    });
  };

  const handleComplete = (questId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuest.mutate({ questId, data: { completed: true } }, {
      onSuccess: (res) => {
        triggerXPGain(res.xpGained, e);
        if (res.leveledUp && res.newLevel) {
          triggerLevelUp(res.newLevel);
        }
        queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/summary"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/weekly"] });
      }
    });
  };

  const handleDelete = (questId: number) => {
    deleteQuest.mutate({ questId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/summary"] });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-widest">Quest Log</h1>
          <p className="text-muted-foreground font-display tracking-widest uppercase mt-1">Available Objectives</p>
        </div>

        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 px-6 py-3 rounded-md transition-all glow-box font-display font-bold uppercase tracking-widest">
              <Plus className="w-5 h-5" /> New Quest
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 glass-panel bg-card border border-primary/30 p-6 md:p-8 shadow-[0_0_30px_hsl(var(--primary)/0.1)] rounded-xl outline-none focus:outline-none">
              <Dialog.Title className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-2 border-b border-border pb-4">Assign Objective</Dialog.Title>
              <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Title</label>
                  <input {...form.register("title")} className="w-full bg-black/50 border border-border focus:border-primary px-4 py-3 rounded-md text-white outline-none transition-colors focus:shadow-[0_0_10px_hsl(var(--primary)/0.1)]" placeholder="e.g. Complete 100 pushups" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Description</label>
                  <textarea {...form.register("description")} className="w-full bg-black/50 border border-border focus:border-primary px-4 py-3 rounded-md text-white outline-none h-24 resize-none transition-colors focus:shadow-[0_0_10px_hsl(var(--primary)/0.1)]" placeholder="Optional details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Difficulty</label>
                    <select {...form.register("difficulty")} className="w-full bg-black/50 border border-border focus:border-primary px-4 py-3 rounded-md text-white outline-none appearance-none cursor-pointer">
                      <option value="easy">Easy (+10 XP)</option>
                      <option value="medium">Medium (+25 XP)</option>
                      <option value="hard">Hard (+50 XP)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Category</label>
                    <select {...form.register("category")} className="w-full bg-black/50 border border-border focus:border-primary px-4 py-3 rounded-md text-white outline-none appearance-none cursor-pointer">
                      <option value="strength">Strength</option>
                      <option value="intelligence">Intelligence</option>
                      <option value="discipline">Discipline</option>
                      <option value="health">Health</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
                  <Dialog.Close asChild>
                    <button type="button" className="px-6 py-3 bg-black/50 text-white border border-border hover:bg-white/5 transition-colors rounded-md font-display uppercase font-bold tracking-widest">Cancel</button>
                  </Dialog.Close>
                  <button type="submit" disabled={createQuest.isPending} className="px-6 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 transition-all rounded-md font-display uppercase font-bold tracking-widest glow-box disabled:opacity-50">
                    {createQuest.isPending ? "Creating..." : "Confirm"}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <div className="flex p-1 bg-black/40 border border-border rounded-lg w-full md:w-fit overflow-x-auto">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 md:flex-none px-6 py-3 rounded-md font-display uppercase font-bold tracking-widest transition-all text-sm ${filter === f ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]' : 'text-muted-foreground hover:text-white border border-transparent'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center text-primary font-display uppercase tracking-widest animate-pulse">
              Scanning Data...
            </motion.div>
          ) : quests?.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="py-16 text-center text-muted-foreground glass-panel border border-border rounded-xl">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-display uppercase tracking-widest font-bold">No objectives found</p>
              <p className="text-sm mt-2 opacity-50 font-sans">Time to rest, or assign new objectives.</p>
            </motion.div>
          ) : (
            quests?.map((quest, i) => (
              <motion.div
                layout
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className={`glass-panel p-5 md:p-6 rounded-xl border relative overflow-hidden group transition-all duration-300 ${quest.completed ? 'border-secondary/20 bg-black/60' : 'border-white/10 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] hover:bg-white/[0.02]'}`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 relative z-10">
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[10px] font-bold font-display uppercase tracking-widest px-2 py-1 rounded border ${
                        quest.difficulty === 'hard' ? 'bg-destructive/10 text-destructive border-destructive/30' : 
                        quest.difficulty === 'medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 
                        'bg-green-500/10 text-green-500 border-green-500/30'
                      }`}>
                        {quest.difficulty}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-display uppercase tracking-widest border border-border px-2 py-1 rounded">{quest.category}</span>
                    </div>
                    <h3 className={`text-xl font-bold font-sans tracking-wide ${quest.completed ? 'text-muted-foreground line-through opacity-70' : 'text-white'}`}>{quest.title}</h3>
                    {quest.description && (
                      <p className={`mt-2 text-sm leading-relaxed ${quest.completed ? 'text-muted-foreground/40' : 'text-muted-foreground/80'}`}>{quest.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center md:flex-col justify-between md:items-end gap-4 shrink-0 border-t md:border-t-0 border-border pt-4 md:pt-0">
                    <div className={`font-display font-bold uppercase tracking-widest text-lg ${quest.completed ? 'text-secondary/50' : 'text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary)/0.5)]'}`}>
                      +{quest.xpReward} XP
                    </div>
                    {!quest.completed ? (
                      <button 
                        onClick={(e) => handleComplete(quest.id, e)}
                        className="bg-secondary/10 hover:bg-secondary/30 text-secondary border border-secondary/30 hover:border-secondary p-3 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_hsl(var(--secondary)/0.3)] flex items-center justify-center"
                        title="Complete Quest"
                      >
                        <Check className="w-6 h-6" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-secondary font-display uppercase tracking-widest border border-secondary/20 px-3 py-1.5 rounded bg-secondary/5">Completed</span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(quest.id)}
                  className={`absolute top-4 right-4 p-2 text-muted-foreground/50 hover:text-destructive transition-colors z-20 rounded-md hover:bg-destructive/10 ${quest.completed ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100 opacity-100'}`}
                  title="Abandon Quest"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
