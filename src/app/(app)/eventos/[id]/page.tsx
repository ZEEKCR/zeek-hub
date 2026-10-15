import { notFound } from "next/navigation";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { KpiStat } from "@/components/ui/kpi-stat";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatWhen } from "@/lib/dates";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { STATUS_LABEL } from "@/server/catalog/status";
import { viewOf } from "@/server/catalog/view";

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
          <KpiStat label="Tareas" value={String(tasks.length)} />
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
        {tasks.map((task) => (
          <article key={task.id} className="bg-surface-1 rounded-[20px] p-4">
            <h3 className="font-semibold">{task.title}</h3>
            <p className="text-muted mt-1 text-sm">
              {view.personName(task.assigneeIds[0] ?? "")} ·{" "}
              {view.teamName(task.teamIds[0] ?? "")} ·{" "}
              {STATUS_LABEL[task.status]}
            </p>
          </article>
        ))}
      </details>
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
