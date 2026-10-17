import Link from "next/link";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { QuerySelect } from "@/components/ui/query-select";
import { one, searchRecord } from "@/lib/query";
import { formatCostaRica, formatWhen } from "@/lib/dates";
import { requireActor } from "@/server/auth/request";
import { assigneeKeys, isPastDue } from "@/server/catalog/focus";
import { loadCatalog } from "@/server/catalog/load";
import { canMoveTask, dayKey, todayKey, viewOf } from "@/server/catalog/view";
import { isArchivedTask } from "@/server/catalog/archive";

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
  const showOverdue = one(raw.vencidas) === "1";
  const today = todayKey();
  const mineKeys = assigneeKeys(
    actor.volunteerId,
    actor.notionUserId,
    actor.fullName,
  );
  const filtered = catalog.tasks.filter((task) => {
    if (isArchivedTask(task, catalog.activities)) return false;
    if (!showOverdue && isPastDue(task, today)) return false;
    if (team !== "all" && !task.teamIds.includes(team)) return false;
    if (
      person !== "all" &&
      !view.personIds(person).some((id) => task.assigneeIds.includes(id))
    )
      return false;
    if (event !== "all" && !task.activityIds.includes(event)) return false;
    if (mine && !task.assigneeIds.some((id) => mineKeys.includes(id)))
      return false;
    return true;
  });

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
          Tareas
        </h1>
        {actor.role === "admin" || actor.role === "head" ? (
          <Link
            href="/tareas/nueva"
            className="bg-accent inline-flex h-12 items-center rounded-full px-5 font-medium text-[#161616]"
          >
            Nueva tarea
          </Link>
        ) : null}
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <QuerySelect
          label="Equipo"
          pathname="/tareas"
          search={search}
          param="equipo"
          value={team}
          options={[
            { id: "all", label: "Todos los equipos" },
            ...catalog.teams.map((item) => ({
              id: item.id,
              label: item.name,
            })),
          ]}
        />
        <QuerySelect
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
        <QuerySelect
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
        <QuerySelect
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
        <QuerySelect
          label="Vencidas"
          pathname="/tareas"
          search={search}
          param="vencidas"
          value={showOverdue ? "1" : "all"}
          options={[
            { id: "all", label: "Ocultar" },
            { id: "1", label: "Mostrar" },
          ]}
        />
      </div>
      <KanbanBoard
        key={`${team}:${person}:${event}:${mine ? "1" : "0"}:${showOverdue ? "1" : "0"}`}
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
            locked: !canMoveTask(actor, task),
          };
        })}
      />
    </div>
  );
}
