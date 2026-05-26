import type { MouseEvent } from "react";
import { Swords } from "lucide-react";
import "./QuestAcceptButton.css";

interface QuestAcceptButtonProps {
  accepted: boolean;
  completed: boolean;
  onAccept: (event: MouseEvent<HTMLButtonElement>) => void;
  size?: "sm" | "md";
}

export function QuestAcceptButton({
  accepted,
  completed,
  onAccept,
  size = "md",
}: QuestAcceptButtonProps) {
  if (completed) return null;

  if (accepted) {
    return (
      <span className={`quest-accept-pill quest-accept-pill-${size}`}>
        Quest In Progress
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`quest-accept-button quest-accept-button-${size}`}
      onClick={onAccept}
    >
      <Swords className="quest-accept-icon" />
      Accept Quest
    </button>
  );
}
