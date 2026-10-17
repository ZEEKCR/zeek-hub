import { ArrowUpRight, CalendarDays, Lock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { STATUS_LABEL } from "@/server/catalog/status";
import type { TaskStatus } from "@/server/domain/types";

const STATUS_TONE: Record<TaskStatus, string> = {
  not_started: "",
  in_progress: "badge-violet",
  blocked: "badge-danger",
  done: "badge-accent",
};

export function TaskCard({
  title,
  meta,
  assignee,
  team,
  event,
  status,
  priority,
  active = false,
  locked = false,
  href,
}: {
  title: string;
  meta: string;
  assignee: string;
  team: string;
  event?: string;
  status: TaskStatus;
  priority?: string;
  active?: boolean;
  locked?: boolean;
  href?: string;
}) {
  const hasAssignee = assignee && assignee !== "Sin asignar";
  const actionClass =
    "bg-surface-2 text-fg hover:bg-surface-3 relative z-10 grid size-9 shrink-0 place-items-center rounded-full transition-colors after:absolute after:-inset-[1000px] after:content-['']";
  return (
    <article
      className={`bg-surface-1 shadow-card relative flex items-start gap-3 overflow-hidden rounded-[20px] border p-4 motion-safe:transition motion-safe:hover:-translate-y-0.5 ${
        active ? "border-accent/60" : "border-line"
      }`}
    >
      {active ? (
        <span aria-hidden className="bg-accent absolute inset-y-0 left-0 w-1" />
      ) : null}
      <Avatar name={hasAssignee ? assignee : team || "Z"} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <PriorityBadge {...(priority ? { priority } : {})} />
          <h3 className="min-w-0 text-base leading-snug font-semibold">
            {title}
          </h3>
          {locked ? (
            <Lock size={14} className="text-muted" aria-label="Solo lectura" />
          ) : null}
        </div>
        <p className="text-muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} aria-hidden />
            {meta}
          </span>
          {hasAssignee ? <span>{assignee}</span> : null}
          {team ? <span>{team}</span> : null}
          {event ? <span className="text-violet-text">{event}</span> : null}
        </p>
        <p className="mt-2.5">
          <span className={`badge ${STATUS_TONE[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </p>
      </div>
      {href ? (
        <a className={actionClass} href={href} aria-label={`Abrir ${title}`}>
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </a>
      ) : (
        <button
          type="button"
          className={actionClass}
          aria-label={`Abrir ${title}`}
        >
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </button>
      )}
    </article>
  );
}
