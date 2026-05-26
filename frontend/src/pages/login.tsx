import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginUser } from "../lib/api-client-react";
import { customFetch } from "../lib/api-client-react/custom-fetch";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useLoginUser();
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    login.mutate({ data }, {
      onSuccess: async (res) => {
        localStorage.setItem("levelup_token", res.token);
        // Check onboarding status and route accordingly
        try {
          const status = await customFetch<{ onboardingComplete: boolean }>("/api/onboarding/status");
          setLocation(status.onboardingComplete ? "/dashboard" : "/onboarding");
        } catch {
          setLocation("/dashboard");
        }
      }
    });
  };


  return (
    <div className="min-h-[100dvh] w-full bg-background flex items-center justify-center relative overflow-hidden font-sans p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 relative z-10 glass-panel border border-primary/20 rounded-xl"
      >
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto text-primary mb-4 animate-pulse drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]" />
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-widest glow-text">LevelUp</h1>
          <p className="text-primary/70 font-display uppercase tracking-widest mt-2 text-sm">Initialize System Link</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Identity (Email)</label>
            <input 
              {...form.register("email")}
              className="w-full bg-black/50 border border-border focus:border-primary px-4 py-3 rounded-md text-white outline-none transition-all focus:shadow-[0_0_10px_hsl(var(--primary)/0.2)]"
              placeholder="hunter@guild.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Passcode</label>
            <input 
              type="password"
              {...form.register("password")}
              className="w-full bg-black/50 border border-border focus:border-primary px-4 py-3 rounded-md text-white outline-none transition-all focus:shadow-[0_0_10px_hsl(var(--primary)/0.2)]"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={login.isPending}
            className="w-full py-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 font-display font-bold uppercase tracking-widest rounded-md transition-all glow-box disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {login.isPending ? "Connecting..." : "Enter System"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/register" className="text-sm text-muted-foreground hover:text-white transition-colors font-display tracking-wider uppercase">
            New Player? Initialize Registration
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
