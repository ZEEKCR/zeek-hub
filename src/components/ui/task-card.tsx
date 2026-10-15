import { Lock } from "lucide-react";
import { NotchedCard } from "@/components/ui/notched-card";
import { STATUS_LABEL } from "@/server/catalog/status";
import type { TaskStatus } from "@/server/domain/types";

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
  return (
    <NotchedCard
      active={active}
      actionLabel={`Abrir ${title}`}
      {...(href ? { href } : {})}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <p>
          {assignee}
          <span className="opacity-70"> · {team}</span>
        </p>
        {locked ? <Lock size={14} aria-label="Solo lectura" /> : null}
      </div>
      <h3 className="mt-3 text-xl font-semibold">
        {priority === "P0" || priority === "P1" ? (
          <span
            className="bg-danger mr-2 inline-block size-2 rounded-full align-middle"
            aria-label={`Prioridad ${priority}`}
          />
        ) : null}
        {title}
      </h3>
      <p className="mt-3 text-sm">
        {meta}
        {event ? ` · ${event}` : ""}
      </p>
      <p className="mt-4 inline-flex rounded-full bg-black/10 px-3 py-1 text-xs font-medium">
        {STATUS_LABEL[status]}
      </p>
    </NotchedCard>
  );
}
