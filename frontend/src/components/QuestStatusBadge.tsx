import "./QuestStatusBadge.css";

export type QuestStatusType = "available" | "active" | "completed" | "suspicious";

const STATUS_MAP: Record<QuestStatusType, { label: string; className: string }> = {
  available: { label: "Awaiting Acceptance", className: "quest-status-available" },
  active: { label: "Quest In Progress", className: "quest-status-active" },
  completed: { label: "Completed", className: "quest-status-completed" },
  suspicious: { label: "Sincerity Check", className: "quest-status-suspicious" },
};

export function QuestStatusBadge({ status }: { status: QuestStatusType }) {
  const config = STATUS_MAP[status];
  return <span className={`quest-status-badge ${config.className}`}>{config.label}</span>;
}
