import { useEffect, useState } from "react";
import "./ActiveQuestTimer.css";

interface ActiveQuestTimerProps {
  acceptedAt: string;
  recommendedMinutes: number;
}

function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [minutes.toString().padStart(2, "0"), seconds.toString().padStart(2, "0")];
  if (hours > 0) {
    parts.unshift(hours.toString());
  }
  return parts.join(":");
}

export function ActiveQuestTimer({ acceptedAt, recommendedMinutes }: ActiveQuestTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const acceptedMs = new Date(acceptedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((now - acceptedMs) / 1000));
  const totalSeconds = Math.max(1, Math.round(recommendedMinutes * 60));
  const progress = Math.min(elapsedSeconds / totalSeconds, 1);

  return (
    <div className="active-quest-timer">
      <div className="active-quest-timer-row">
        <span className="active-quest-timer-label">Elapsed</span>
        <span className="active-quest-timer-value">{formatClock(elapsedSeconds)}</span>
        <span className="active-quest-timer-divider" />
        <span className="active-quest-timer-label">Goal</span>
        <span className="active-quest-timer-value">{recommendedMinutes}m</span>
      </div>
      <div className="active-quest-timer-bar">
        <div className="active-quest-timer-progress" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
