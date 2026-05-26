import { Flame } from "lucide-react";
import "./StreakCounter.css";

interface StreakCounterProps {
  loginStreak: number;
  lastLoginDate: string | null;
}

export function StreakCounter({ loginStreak, lastLoginDate }: StreakCounterProps) {
  const getTodayDateString = (): string => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0]!;
  };

  const today = getTodayDateString();
  const loggedInToday = lastLoginDate === today;

  return (
    <div className="streak-container">
      <div className="glass-panel px-3 sm:px-6 py-2 sm:py-3 rounded-lg border border-amber-500/30 flex flex-col items-center justify-center">
        <span className="text-xs font-bold font-display uppercase tracking-widest mb-1 whitespace-nowrap">Login Streak</span>
        <div className={`streak-display ${loggedInToday ? "active" : ""}`}>
          <Flame className={`streak-flame ${loginStreak >= 7 ? "large" : ""}`} />
          <span className="streak-number">{loginStreak}</span>
          <span className="streak-label">Days</span>
        </div>
        {loggedInToday && (
          <span className="text-xs text-amber-400 font-semibold mt-1 animate-pulse whitespace-nowrap">
            ✓ Logged in today
          </span>
        )}
      </div>
    </div>
  );
}
