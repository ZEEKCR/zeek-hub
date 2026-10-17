const TONE: Record<string, string> = {
  P0: "badge-danger",
  P1: "badge-warning",
  P2: "badge-info",
  P3: "",
};

export function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;
  return (
    <span
      className={`badge ${TONE[priority] ?? ""}`}
      aria-label={`Prioridad ${priority}`}
    >
      {priority}
    </span>
  );
}
