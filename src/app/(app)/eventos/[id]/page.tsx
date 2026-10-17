import { notFound } from "next/navigation";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { KpiStat } from "@/components/ui/kpi-stat";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatWhen } from "@/lib/dates";
import { requireActor } from "@/server/auth/request";
import { isArchivedTask } from "@/server/catalog/archive";
import { loadCatalog } from "@/server/catalog/load";
import { STATUS_LABEL, STAGE_LABEL } from "@/server/catalog/status";
import { canEditActivity, dayKey, viewOf } from "@/server/catalog/view";
import { ActivityEditor } from "@/components/events/activity-editor";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const view = viewOf(catalog);
  const { id } = await params;
  const activity = catalog.activities.find(
    (item) => item.id === id && item.published,
  );
  if (!activity) notFound();
  const tasks = catalog.tasks.filter((task) =>
    task.activityIds.includes(activity.id),
  );
  const openTasks = tasks.filter(
    (task) => !isArchivedTask(task, catalog.activities),
  );
  const archivedTasks = tasks.filter((task) =>
    isArchivedTask(task, catalog.activities),
  );
  const resources = view
    .visibleResources(actor)
    .filter((resource) => activity.teamIds.includes(resource.teamId));
  const names = activity.volunteerIds.map((volunteerId) =>
    view.personName(volunteerId),
  );

  return (
    <div className="grid gap-6">
      <p className="text-muted text-sm">{activity.kind}</p>
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        {activity.title}
      </h1>
      <p>
        {activity.start
          ? formatWhen(
              activity.start,
              activity.timed,
              "d MMM yyyy, HH:mm",
              "d MMM yyyy",
            )
          : "Sin fecha"}
        {activity.place ? ` · ${activity.place}` : ""}
        {activity.format ? ` · ${activity.format}` : ""}
      </p>
      <ActivityEditor
        locked={!canEditActivity(actor)}
        activity={{
          id: activity.id,
          title: activity.title,
          stage: activity.stage,
          type: activity.kind,
          ...(activity.start ? { date: dayKey(activity.start) } : {}),
          ...(activity.notes ? { notes: activity.notes } : {}),
        }}
      />
      {activity.link ? (
        <a
          href={activity.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-text font-medium"
        >
          Abrir enlace
        </a>
      ) : null}
      <div className="bg-inverse grid gap-4 rounded-[32px] p-5 text-[#161616] md:grid-cols-[1fr_1fr]">
        <div className="grid grid-cols-3 gap-3">
          <KpiStat label="Tareas" value={String(openTasks.length)} />
          <KpiStat
            label="Avance"
            value={`${view.taskProgress(activity.id)}%`}
          />
          <KpiStat label="Voluntarios" value={String(names.length)} />
        </div>
        <div className="grid content-center gap-4">
          <ProgressBar value={view.taskProgress(activity.id)} />
          <AvatarStack names={names} />
        </div>
      </div>
      <details open className="grid gap-3">
        <summary className="cursor-pointer text-2xl font-semibold">
          Tareas relacionadas
        </summary>
        {openTasks.map((task) => (
          <article key={task.id} className="bg-surface-1 rounded-[20px] p-4">
            <h3 className="font-semibold">
              <Link href={`/tareas/${task.id}`} className="hover:underline">
                {task.title}
              </Link>
            </h3>
            <p className="text-muted mt-1 text-sm">
              {view.personName(task.assigneeIds[0] ?? "")} ·{" "}
              {view.teamName(task.teamIds[0] ?? "")} ·{" "}
              {STATUS_LABEL[task.status]}
            </p>
          </article>
        ))}
        {openTasks.length === 0 ? (
          <p className="text-muted text-sm">
            {activity.stage === "finished"
              ? "Las tareas de este evento están archivadas."
              : "No hay tareas relacionadas."}
          </p>
        ) : null}
      </details>
      {archivedTasks.length > 0 ? (
        <details className="grid gap-3">
          <summary className="cursor-pointer text-2xl font-semibold">
            Archivadas · {archivedTasks.length}
          </summary>
          {archivedTasks.map((task) => (
            <article key={task.id} className="bg-surface-1 rounded-[20px] p-4">
              <h3 className="font-semibold">
                <Link href={`/tareas/${task.id}`} className="hover:underline">
                  {task.title}
                </Link>
              </h3>
              <p className="text-muted mt-1 text-sm">
                {STATUS_LABEL[task.status]} · {STAGE_LABEL.finished}
              </p>
            </article>
          ))}
        </details>
      ) : null}
      <details open className="grid gap-3">
        <summary className="cursor-pointer text-2xl font-semibold">
          Recursos
        </summary>
        {resources.length === 0 ? (
          <p className="text-muted text-sm">
            No hay recursos de estos equipos.
          </p>
        ) : (
          resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-1 rounded-[20px] px-4 py-3 font-medium"
            >
              {resource.title}
            </a>
          ))
        )}
      </details>
    </div>
  );
}
