import { useEffect, useState } from "react";
import "./QuestTimer.css";

interface QuestTimerProps {
  acceptedAt: string | null;
  recommendedMinutes: number;
  completed?: boolean;
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

export function QuestTimer({
  acceptedAt,
  recommendedMinutes,
  completed = false,
}: QuestTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!acceptedAt || completed) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [acceptedAt, completed]);

  if (!acceptedAt) return null;

  const acceptedMs = new Date(acceptedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((now - acceptedMs) / 1000));
  const totalSeconds = Math.max(1, Math.round(recommendedMinutes * 60));
  const rawProgress = elapsedSeconds / totalSeconds;
  const progress = completed ? 1 : Math.min(rawProgress, 1);
  const isReady = progress >= 1;

  return (
    <div className="quest-timer">
      <div className="quest-timer-row">
        <span className="quest-timer-label">Elapsed</span>
        <span className="quest-timer-value">{formatClock(elapsedSeconds)}</span>
        <span className="quest-timer-dot" />
        <span className="quest-timer-label">Recommended</span>
        <span className="quest-timer-value">{recommendedMinutes}m</span>
      </div>
      <div className="quest-timer-bar">
        <div
          className={`quest-timer-progress ${isReady ? "ready" : ""}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className={`quest-timer-hint ${isReady ? "ready" : ""}`}>
        {completed ? "Quest complete" : isReady ? "Recommended time reached" : "In progress"}
      </div>
    </div>
  );
}
