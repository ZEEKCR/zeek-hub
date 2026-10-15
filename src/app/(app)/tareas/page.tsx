import { KanbanBoard } from "@/components/tasks/kanban-board";
import { KpiStat } from "@/components/ui/kpi-stat";
import { QueryChips } from "@/components/ui/query-chips";
import { one, searchRecord } from "@/lib/query";
import { formatCostaRica, formatWhen } from "@/lib/dates";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { STATUS_ORDER } from "@/server/catalog/status";
import { canEditTask, dayKey, todayKey, viewOf } from "@/server/catalog/view";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const view = viewOf(catalog);
  const raw = await searchParams;
  const search = searchRecord(raw);
  const team = one(raw.equipo) ?? "all";
  const person = one(raw.responsable) ?? "all";
  const event = one(raw.evento) ?? "all";
  const mine = one(raw.mias) === "1";
  const filtered = catalog.tasks.filter((task) => {
    if (team !== "all" && !task.teamIds.includes(team)) return false;
    if (person !== "all" && !task.assigneeIds.includes(person)) return false;
    if (event !== "all" && !task.activityIds.includes(event)) return false;
    if (
      mine &&
      actor.volunteerId &&
      !task.assigneeIds.includes(actor.volunteerId)
    )
      return false;
    return true;
  });
  const today = todayKey();

  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        Tareas
      </h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <KpiStat
            key={status}
            label={
              status === "not_started"
                ? "Por hacer"
                : status === "in_progress"
                  ? "En progreso"
                  : status === "blocked"
                    ? "Bloqueadas"
                    : "Listas"
            }
            value={String(
              filtered.filter((task) => task.status === status).length,
            )}
          />
        ))}
      </div>
      <QueryChips
        label="Equipo"
        pathname="/tareas"
        search={search}
        param="equipo"
        value={team}
        options={[
          { id: "all", label: "Todos los equipos" },
          ...catalog.teams.map((item) => ({ id: item.id, label: item.name })),
        ]}
      />
      <QueryChips
        label="Responsable"
        pathname="/tareas"
        search={search}
        param="responsable"
        value={person}
        options={[
          { id: "all", label: "Todos" },
          ...catalog.people.map((member) => ({
            id: member.id,
            label: member.name,
          })),
        ]}
      />
      <QueryChips
        label="Evento"
        pathname="/tareas"
        search={search}
        param="evento"
        value={event}
        options={[
          { id: "all", label: "Todos" },
          ...view.publishedActivities().map((activity) => ({
            id: activity.id,
            label: activity.title,
          })),
        ]}
      />
      <QueryChips
        label="Alcance"
        pathname="/tareas"
        search={search}
        param="mias"
        value={mine ? "1" : "all"}
        options={[
          { id: "all", label: "Todas" },
          { id: "1", label: "Solo mías" },
        ]}
      />
      <KanbanBoard
        key={`${team}:${person}:${event}:${mine ? "1" : "0"}`}
        tasks={filtered.map((task) => {
          const due = task.dueDate?.start;
          const dueDay = due ? dayKey(due) : "";
          const meta = !due
            ? "Sin fecha"
            : dueDay < today
              ? `Venció ${formatCostaRica(due, "d MMM")}`
              : formatWhen(due, task.dueDate?.timed, "d MMM, HH:mm", "d MMM");
          return {
            id: task.id,
            title: task.title,
            status: task.status,
            meta,
            assignee: view.personName(task.assigneeIds[0] ?? ""),
            team: view.teamName(task.teamIds[0] ?? ""),
            event: view.activityTitle(task.activityIds[0] ?? ""),
            ...(task.priority ? { priority: task.priority } : {}),
            locked: !canEditTask(actor, task),
          };
        })}
      />
    </div>
  );
}
