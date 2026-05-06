import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegisterUser } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";

const schema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const registerMutation = useRegisterUser();
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", password: "" }
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("levelup_token", res.token);
        setLocation("/dashboard");
      }
    });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex items-center justify-center relative overflow-hidden font-sans p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/10 via-background to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 relative z-10 glass-panel border border-secondary/20 rounded-xl"
      >
        <div className="text-center mb-8">
          <Crosshair className="w-16 h-16 mx-auto text-secondary mb-4 animate-pulse drop-shadow-[0_0_15px_hsl(var(--secondary)/0.5)]" />
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-widest glow-text" style={{ textShadow: '0 0 10px hsl(var(--secondary)/0.5)' }}>Join Guild</h1>
          <p className="text-secondary/70 font-display uppercase tracking-widest mt-2 text-sm">Create Character Profile</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Codename</label>
            <input 
              {...form.register("username")}
              className="w-full bg-black/50 border border-border focus:border-secondary px-4 py-3 rounded-md text-white outline-none transition-all focus:shadow-[0_0_10px_hsl(var(--secondary)/0.2)]"
              placeholder="ShadowMonarch"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Comm Link (Email)</label>
            <input 
              {...form.register("email")}
              className="w-full bg-black/50 border border-border focus:border-secondary px-4 py-3 rounded-md text-white outline-none transition-all focus:shadow-[0_0_10px_hsl(var(--secondary)/0.2)]"
              placeholder="hunter@guild.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-display">Passcode</label>
            <input 
              type="password"
              {...form.register("password")}
              className="w-full bg-black/50 border border-border focus:border-secondary px-4 py-3 rounded-md text-white outline-none transition-all focus:shadow-[0_0_10px_hsl(var(--secondary)/0.2)]"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={registerMutation.isPending}
            className="w-full py-4 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/50 font-display font-bold uppercase tracking-widest rounded-md transition-all disabled:opacity-50"
            style={{ boxShadow: '0 0 15px hsl(var(--secondary)/0.2), inset 0 0 20px hsl(var(--secondary)/0.05)' }}
          >
            {registerMutation.isPending ? "Creating..." : "Awaken"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors font-display uppercase tracking-wider">
            Already Awakened? Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
