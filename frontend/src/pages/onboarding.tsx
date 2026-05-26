import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sword, Brain, Flame, Heart, ChevronRight, ChevronLeft,
  Zap, Clock, Sun, Moon, Loader2, Check, Sparkles,
  Dumbbell, BookOpen, Code2, Target, Leaf, Scale, Headphones,
  User, AlertTriangle,
} from "lucide-react";
import { customFetch } from "@/lib/api-client-react/custom-fetch";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Quest { title: string; difficulty: string; duration: number; xp: number; category: string; }

interface OnboardingData {
  // Step 1 – Basic Info
  name: string;
  age: string;
  height: string;
  weight: string;
  // Step 2 – Goals
  goals: string[];
  // Step 3 – Schedule
  wakeUpTime: string;
  sleepTime: string;
  workStart: string;
  workEnd: string;
  commuteMinutes: string;
  // Step 4 – Skill Levels
  codingLevel: "beginner" | "intermediate" | "advanced";
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  studyConsistency: "low" | "medium" | "high";
  // Step 5 – Personality
  distractedEasily: boolean;
  stressLevel: "low" | "medium" | "high";
  chronotype: "morning" | "night";
}

const DEFAULT: OnboardingData = {
  name: "", age: "", height: "", weight: "",
  goals: [],
  wakeUpTime: "06:30", sleepTime: "23:00", workStart: "09:00", workEnd: "17:00", commuteMinutes: "0",
  codingLevel: "beginner", fitnessLevel: "beginner", studyConsistency: "medium",
  distractedEasily: false, stressLevel: "medium", chronotype: "morning",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GOALS = [
  { value: "fitness",      label: "Fitness",      icon: Dumbbell,  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40" },
  { value: "coding",       label: "Coding",       icon: Code2,     color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/40" },
  { value: "discipline",   label: "Discipline",   icon: Target,    color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/40" },
  { value: "study",        label: "Study",        icon: Brain,     color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/40" },
  { value: "weight_loss",  label: "Weight Loss",  icon: Scale,     color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40" },
  { value: "muscle_gain",  label: "Muscle Gain",  icon: Flame,     color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40" },
  { value: "productivity", label: "Productivity", icon: Zap,       color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/40" },
  { value: "reading",      label: "Reading",      icon: BookOpen,  color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/40" },
  { value: "meditation",   label: "Meditation",   icon: Leaf,      color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/40" },
];

const STEP_TITLES = [
  { step: 1, title: "Identify Yourself",  subtitle: "Basic stat initialization" },
  { step: 2, title: "Choose Your Path",   subtitle: "Select your growth domains" },
  { step: 3, title: "Map Your Day",       subtitle: "Configure your schedule matrix" },
  { step: 4, title: "Assess Your Power",  subtitle: "Current skill calibration" },
  { step: 5, title: "Know Thyself",       subtitle: "Personality imprint scan" },
  { step: 6, title: "Quest Forge",        subtitle: "AI generating your destiny..." },
];

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// ─── Shared input style ───────────────────────────────────────────────────────

const INPUT = "w-full bg-black/50 border border-border focus:border-primary px-4 py-3 rounded-lg text-white outline-none transition-all focus:shadow-[0_0_12px_hsl(var(--primary)/0.2)] font-sans placeholder:text-muted-foreground/50";
const LABEL = "text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-display mb-1.5 block";

// ─── Level Selector ───────────────────────────────────────────────────────────

function LevelSelector({
  label, value, onChange, icon: Icon, color,
}: {
  label: string; value: string;
  onChange: (v: "beginner" | "intermediate" | "advanced") => void;
  icon: React.ElementType; color: string;
}) {
  const options = [
    { value: "beginner",     label: "Novice",   stars: 1 },
    { value: "intermediate", label: "Adept",    stars: 2 },
    { value: "advanced",     label: "Master",   stars: 3 },
  ] as const;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color} skill-orb`} />
        <span className={LABEL + " mb-0"}>{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`py-3 px-2 rounded-lg border text-center transition-all font-display uppercase tracking-wider text-xs font-bold ${
              value === opt.value
                ? `${color} border-current bg-current/10 shadow-[0_0_10px_currentColor/30]`
                : "text-muted-foreground border-border hover:border-white/20 hover:text-white"
            }`}
          >
            <div className="text-lg mb-1">{"★".repeat(opt.stars)}{"☆".repeat(3 - opt.stars)}</div>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step Components ─────────────────────────────────────────────────────────

function Step1({ data, set }: { data: OnboardingData; set: (k: keyof OnboardingData, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5">
        <div>
          <label className={LABEL}>Hunter Codename</label>
          <input className={INPUT} placeholder="Aaditya" value={data.name}
            onChange={e => set("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>Age (years)</label>
            <input type="number" className={INPUT} placeholder="20" value={data.age}
              onChange={e => set("age", e.target.value)} min={10} max={100} />
          </div>
          <div>
            <label className={LABEL}>Height (cm)</label>
            <input type="number" className={INPUT} placeholder="175" value={data.height}
              onChange={e => set("height", e.target.value)} min={50} max={300} />
          </div>
          <div>
            <label className={LABEL}>Weight (kg)</label>
            <input type="number" className={INPUT} placeholder="70" value={data.weight}
              onChange={e => set("weight", e.target.value)} min={20} max={500} />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Sword,  label: "Strength",     color: "text-red-400"    },
            { icon: Brain,  label: "Intelligence",  color: "text-blue-400"   },
            { icon: Flame,  label: "Discipline",    color: "text-orange-400" },
            { icon: Heart,  label: "Health",        color: "text-green-400"  },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label}
              className="glass-panel rounded-lg p-3 border border-white/5 flex flex-col items-center gap-2 opacity-50">
              <Icon className={`w-6 h-6 ${color}`} />
              <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">{label}</span>
              <span className="text-xs font-bold text-white/60">Will unlock</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 text-center mt-3 font-display uppercase tracking-widest">
          Stats are earned by completing quests
        </p>
      </div>
    </div>
  );
}

function Step2({ data, set }: { data: OnboardingData; set: (k: keyof OnboardingData, v: any) => void }) {
  const toggle = (g: string) => {
    set("goals", data.goals.includes(g)
      ? data.goals.filter(x => x !== g)
      : [...data.goals, g]);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground font-display uppercase tracking-widest">
        Select your growth paths — choose all that apply
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {GOALS.map(({ value, label, icon: Icon, color, bg, border }) => {
          const selected = data.goals.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className={`relative group p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                selected
                  ? `${bg} ${border} ${color} shadow-[0_0_15px_hsl(var(--secondary)/0.15)]`
                  : "bg-black/30 border-white/8 text-muted-foreground hover:border-white/20 hover:text-white"
              }`}
            >
              <div className={`p-2 rounded-lg ${selected ? `${bg} ${border}` : "bg-white/5 border border-white/10"}`}>
                <Icon className={`w-4 h-4 ${selected ? color : "text-muted-foreground"}`} />
              </div>
              <span className="font-display font-bold uppercase tracking-wide text-sm">{label}</span>
              {selected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-secondary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {data.goals.length > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs text-secondary font-display uppercase tracking-widest font-bold"
          style={{ textShadow: "0 0 8px hsl(var(--secondary)/0.5)" }}
        >
          {data.goals.length} path{data.goals.length !== 1 ? "s" : ""} chosen ✦
        </motion.p>
      )}
    </div>
  );
}

function Step3({ data, set }: { data: OnboardingData; set: (k: keyof OnboardingData, v: any) => void }) {
  const calcFree = () => {
    try {
      const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      const wake = toMin(data.wakeUpTime), sleep = toMin(data.sleepTime);
      const awake = sleep > wake ? sleep - wake : 24 * 60 - wake + sleep;
      let busy = Number(data.commuteMinutes) || 0;
      if (data.workStart && data.workEnd) {
        const ws = toMin(data.workStart), we = toMin(data.workEnd);
        busy += we > ws ? we - ws : 0;
      }
      return Math.max(0, awake - busy - 90);
    } catch { return 0; }
  };
  const freeMin = calcFree();
  const freeH = Math.floor(freeMin / 60);
  const freeM = freeMin % 60;

  const TimeInput = ({ label, field }: { label: string; field: keyof OnboardingData }) => (
    <div>
      <label className={LABEL}>{label}</label>
      <input type="time" className={INPUT + " cursor-pointer"} value={data[field] as string}
        onChange={e => set(field, e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <TimeInput label="🌅 Wake Up" field="wakeUpTime" />
        <TimeInput label="🌙 Bed Time" field="sleepTime" />
      </div>

      <div className="border-t border-border/50 pt-4 space-y-4">
        <p className={LABEL + " text-center"}>College / Work Hours (optional)</p>
        <div className="grid grid-cols-2 gap-4">
          <TimeInput label="Work / College Start" field="workStart" />
          <TimeInput label="Work / College End" field="workEnd" />
        </div>
        <div>
          <label className={LABEL}>Daily Commute: {data.commuteMinutes || 0} min</label>
          <input type="range" min={0} max={180} step={5}
            value={Number(data.commuteMinutes) || 0}
            onChange={e => set("commuteMinutes", e.target.value)}
            className="w-full accent-primary h-2 bg-black/50 rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-display uppercase tracking-widest mt-1">
            <span>0 min</span><span>1.5h</span><span>3h</span>
          </div>
        </div>
      </div>

      {/* Free time display */}
      <motion.div
        key={freeMin}
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        className={`flex items-center justify-between p-4 rounded-xl border ${
          freeMin >= 60 ? "border-primary/30 bg-primary/5" : "border-orange-500/30 bg-orange-500/5"
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock className={`w-5 h-5 ${freeMin >= 60 ? "text-primary" : "text-orange-400"}`} />
          <div>
            <div className={LABEL + " mb-0"}>Estimated Free Time</div>
            <div className={`text-xl font-bold font-display ${freeMin >= 60 ? "text-primary" : "text-orange-400"}`}
              style={{ textShadow: freeMin >= 60 ? "0 0 10px hsl(var(--primary)/0.5)" : "" }}>
              {freeH > 0 ? `${freeH}h ` : ""}{freeM}min
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={LABEL + " mb-0"}>Quest Budget</div>
          <div className="text-sm font-bold text-white font-display">
            {freeMin < 30 ? "⚠️ Very tight" : freeMin < 60 ? "Compact mode" : freeMin < 120 ? "Balanced load" : "Full training"}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Step4({ data, set }: { data: OnboardingData; set: (k: keyof OnboardingData, v: any) => void }) {
  const consistencyOpts = [
    { value: "low",    label: "Irregular", desc: "Miss days often",   color: "text-red-400"    },
    { value: "medium", label: "Moderate",  desc: "Mostly consistent", color: "text-yellow-400" },
    { value: "high",   label: "Disciplined",desc: "Rarely miss",      color: "text-green-400"  },
  ] as const;

  return (
    <div className="space-y-7">
      <LevelSelector
        label="Coding / Tech Skills"
        value={data.codingLevel}
        onChange={v => set("codingLevel", v)}
        icon={Code2}
        color="text-blue-400"
      />
      <LevelSelector
        label="Fitness Level"
        value={data.fitnessLevel}
        onChange={v => set("fitnessLevel", v)}
        icon={Dumbbell}
        color="text-red-400"
      />

      <div className="border-t border-border/50 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-orange-400 skill-orb" />
          <span className={LABEL + " mb-0"}>Study / Work Consistency</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {consistencyOpts.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("studyConsistency", opt.value)}
              className={`p-4 rounded-xl border text-center transition-all ${
                data.studyConsistency === opt.value
                  ? `${opt.color} border-current bg-current/10`
                  : "text-muted-foreground border-border hover:border-white/20 hover:text-white"
              }`}
            >
              <div className="font-display font-bold uppercase tracking-wide text-sm mb-1">{opt.label}</div>
              <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5({ data, set }: { data: OnboardingData; set: (k: keyof OnboardingData, v: any) => void }) {
  const Toggle = ({ label, desc, field, icon: Icon }:
    { label: string; desc: string; field: keyof OnboardingData; icon: React.ElementType }) => (
    <button
      type="button"
      onClick={() => set(field, !data[field])}
      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
        data[field]
          ? "border-secondary/40 bg-secondary/5 text-secondary"
          : "border-border bg-black/30 text-muted-foreground hover:border-white/20 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div className="text-left">
          <div className="font-display font-bold uppercase tracking-wide text-sm">{label}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full transition-all relative ${data[field] ? "bg-secondary" : "bg-white/10"}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data[field] ? "left-7" : "left-1"}`} />
      </div>
    </button>
  );

  const stressOptions = [
    { value: "low",    label: "Calm",    emoji: "😌", desc: "Relaxed state"      },
    { value: "medium", label: "Normal",  emoji: "😐", desc: "Manageable levels"  },
    { value: "high",   label: "Stressed",emoji: "😤", desc: "High pressure"      },
  ] as const;

  return (
    <div className="space-y-6">
      <Toggle
        field="distractedEasily"
        label="Easily Distracted"
        desc="Phone, social media, notifications break my focus"
        icon={Headphones}
      />

      <div>
        <label className={LABEL}>Current Stress Level</label>
        <div className="grid grid-cols-3 gap-3">
          {stressOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("stressLevel", opt.value)}
              className={`p-4 rounded-xl border text-center transition-all ${
                data.stressLevel === opt.value
                  ? opt.value === "high"
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : opt.value === "medium"
                    ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                    : "border-green-500/40 bg-green-500/10 text-green-400"
                  : "border-border bg-black/30 text-muted-foreground hover:border-white/20 hover:text-white"
              }`}
            >
              <div className="text-2xl mb-1">{opt.emoji}</div>
              <div className="font-display font-bold uppercase tracking-wide text-xs">{opt.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL}>Chronotype — When do you peak?</label>
        <div className="grid grid-cols-2 gap-4">
          {([
            { value: "morning", label: "Dawn Warrior",  desc: "Peak energy in the AM", icon: Sun,  color: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" },
            { value: "night",   label: "Night Stalker", desc: "Thrive after sundown",  icon: Moon, color: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10" },
          ] as const).map(opt => {
            const Icon = opt.icon;
            const active = data.chronotype === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("chronotype", opt.value)}
                className={`p-5 rounded-xl border transition-all flex flex-col items-center gap-3 ${
                  active ? opt.color : "border-border bg-black/30 text-muted-foreground hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className={`w-8 h-8 ${active ? "" : "opacity-40"}`} />
                <div className="text-center">
                  <div className="font-display font-bold uppercase tracking-wide text-sm">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step6Forge({ quests, summary, error }: {
  quests: Quest[] | null; summary: string; error: string | null;
}) {
  if (error) return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <AlertTriangle className="w-12 h-12 text-destructive" />
      <p className="text-destructive font-display uppercase tracking-widest text-sm text-center">{error}</p>
    </div>
  );

  if (!quests) return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-primary/20 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary forge-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-primary/40 rune-spin" />
        <div className="absolute inset-[-6px] rounded-full border border-secondary/20 rune-spin" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
      </div>
      <div className="text-center">
        <p className="font-display text-xl font-bold uppercase tracking-widest text-white mb-2">Forging Your Destiny</p>
        <p className="text-muted-foreground text-sm font-display uppercase tracking-widest">AI is crafting your personalized quests...</p>
      </div>
      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-primary forge-pulse"
            style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
    </div>
  );

  const diffStyle: Record<string, string> = {
    easy:   "text-green-400 bg-green-500/10 border-green-500/30",
    medium: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    hard:   "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4 rounded-xl border border-primary/20 flex items-start gap-3"
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-white leading-relaxed">{summary}</p>
      </motion.div>

      <div className="space-y-2.5">
        {quests.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.2 }}
            className="glass-panel p-4 rounded-xl border border-white/8 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[10px] font-bold font-display uppercase tracking-widest px-2 py-0.5 rounded border ${diffStyle[q.difficulty] ?? diffStyle.medium}`}>
                  {q.difficulty}
                </span>
                <span className="text-[10px] text-muted-foreground font-display uppercase tracking-widest border border-border px-2 py-0.5 rounded">
                  {q.category}
                </span>
              </div>
              <p className="text-white text-sm font-medium leading-snug">{q.title}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
              <span className="text-xs text-muted-foreground font-display flex items-center gap-1">
                <Clock className="w-3 h-3" />{q.duration}m
              </span>
              <span className="text-sm font-bold text-secondary font-display flex items-center gap-1">
                <Zap className="w-3 h-3" />+{q.xp} XP
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: quests.length * 0.1 + 0.4 }}
        className="flex items-center justify-center gap-2 py-2"
      >
        <Check className="w-5 h-5 text-green-400" />
        <span className="text-green-400 font-display uppercase tracking-widest text-sm font-bold">
          {quests.length} Day-1 Quests Added to Your Log
        </span>
      </motion.div>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, data: OnboardingData): string | null {
  if (step === 1) {
    if (!data.name.trim()) return "Enter your name";
    if (!data.age || Number(data.age) < 10) return "Enter a valid age (10+)";
    if (!data.height || Number(data.height) < 50) return "Enter height in cm";
    if (!data.weight || Number(data.weight) < 20) return "Enter weight in kg";
  }
  if (step === 2 && data.goals.length === 0) return "Choose at least one goal";
  if (step === 3 && !data.wakeUpTime) return "Set your wake-up time";
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(DEFAULT);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [summary, setSummary] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof OnboardingData, v: any) => setData(prev => ({ ...prev, [k]: v }));

  const goNext = async () => {
    const err = validateStep(step, data);
    if (err) { setError(err); return; }
    setError(null);

    if (step === TOTAL_STEPS) {
      // Submit
      setStep(6);
      setDirection(1);
      await handleSubmit();
      return;
    }

    setDirection(1);
    setStep(s => s + 1);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goBack = () => {
    if (step <= 1) return;
    setError(null);
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        name: data.name.trim(),
        age: Number(data.age),
        height: Number(data.height),
        weight: Number(data.weight),
        goals: data.goals,
        schedule: {
          wakeUpTime: data.wakeUpTime,
          sleepTime: data.sleepTime,
          workStart: data.workStart || null,
          workEnd: data.workEnd || null,
          commuteMinutes: Number(data.commuteMinutes) || 0,
        },
        skillLevels: {
          coding: data.codingLevel,
          fitness: data.fitnessLevel,
          studyConsistency: data.studyConsistency,
        },
        personality: {
          distractedEasily: data.distractedEasily,
          stressLevel: data.stressLevel,
          chronotype: data.chronotype,
        },
      };

      const res: any = await customFetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setQuests(res.quests ?? []);
      setSummary(res.summary ?? "Your quests are ready. Begin your journey.");
    } catch (err: any) {
      const msg = err?.data?.error ?? err?.data?.details?.[0] ?? "Failed to save profile. Please try again.";
      setSubmitError(msg);
      setQuests([]);
      setSummary("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterDashboard = () => {
    // Invalidate quests and stats so the dashboard loads the newly forged data
    queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats/summary"] });
    setLocation("/dashboard");
  };

  const info = STEP_TITLES[(step - 1)] ?? STEP_TITLES[0];
  const progress = Math.min((step / TOTAL_STEPS) * 100, 100);
  const isForge = step === 6;

  return (
    <div className="min-h-[100dvh] w-full bg-background relative overflow-hidden flex flex-col font-sans onboarding-grid">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/4 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-secondary/4 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 px-6 pt-6 pb-4 flex items-center justify-between" ref={topRef}>
        <div>
          <h1 className="text-2xl font-display font-bold text-primary uppercase tracking-widest glow-text">LevelUp</h1>
          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">Life Setup System</p>
        </div>
        {!isForge && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-display uppercase tracking-widest">
              Step <span className="text-white font-bold">{step}</span> of {TOTAL_STEPS}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isForge && (
        <div className="relative z-10 px-6 mb-2">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full onboarding-progress" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            {STEP_TITLES.slice(0, TOTAL_STEPS).map((s, i) => (
              <div key={i} className={`flex flex-col items-center gap-0.5 ${i + 1 <= step ? "opacity-100" : "opacity-30"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${i + 1 < step ? "bg-primary" : i + 1 === step ? "bg-secondary" : "bg-white/20"}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="relative z-10 flex-1 px-4 pb-6 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl border border-white/8 overflow-hidden shadow-2xl"
            style={{ boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 80px hsl(var(--primary)/0.05)" }}
          >
            {/* Step header */}
            <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-display font-bold text-sm">{isForge ? "✦" : step}</span>
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest">{info!.title}</h2>
                  <p className="text-[11px] text-muted-foreground font-display uppercase tracking-widest">{info!.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Step content */}
            <div className="p-6">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 1 && <Step1 data={data} set={set} />}
                  {step === 2 && <Step2 data={data} set={set} />}
                  {step === 3 && <Step3 data={data} set={set} />}
                  {step === 4 && <Step4 data={data} set={set} />}
                  {step === 5 && <Step5 data={data} set={set} />}
                  {step === 6 && (
                    <Step6Forge
                      quests={quests}
                      summary={summary}
                      error={submitError}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Validation error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm font-display uppercase tracking-widest"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            {!isForge && (
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg border border-border text-muted-foreground hover:text-white hover:border-white/20 transition-all font-display uppercase tracking-widest text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Return
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 font-display font-bold uppercase tracking-widest rounded-lg transition-all text-sm disabled:opacity-50"
                  style={{ boxShadow: "0 0 20px hsl(var(--primary)/0.15)" }}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : step === TOTAL_STEPS ? (
                    <><Sparkles className="w-4 h-4" /> Forge My Destiny</>
                  ) : (
                    <>Proceed <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            )}

            {/* Quest forge CTA */}
            {isForge && quests && !submitError && (
              <div className="px-6 py-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleEnterDashboard}
                  className="w-full py-4 bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 text-white border border-primary/40 font-display font-bold uppercase tracking-widest rounded-lg transition-all text-lg flex items-center justify-center gap-3"
                  style={{ boxShadow: "0 0 30px hsl(var(--primary)/0.2)" }}
                >
                  <Sword className="w-6 h-6 text-primary" />
                  Enter the System
                  <ChevronRight className="w-6 h-6 text-secondary" />
                </button>
              </div>
            )}
            {isForge && submitError && (
              <div className="px-6 py-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleEnterDashboard}
                  className="w-full py-3 text-muted-foreground border border-border rounded-lg font-display uppercase tracking-widest text-sm hover:text-white hover:border-white/20 transition-all"
                >
                  Skip & Enter Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
