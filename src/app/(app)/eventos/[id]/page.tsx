import { activityKindLabel, isProject } from "@/server/domain/projects";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  MapPin,
  Plus,
} from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
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
      <Link
        href="/eventos"
        className="text-muted hover:text-fg inline-flex w-fit items-center gap-1.5 text-sm font-semibold"
      >
        <ArrowLeft size={16} aria-hidden />
        Eventos
      </Link>
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-violet">
            {STAGE_LABEL[activity.stage]}
          </span>
          {activity.kind ? (
            <span className="badge">{activityKindLabel(activity.kind)}</span>
          ) : null}
        </div>
        <h1 className="text-3xl leading-tight font-semibold tracking-tight md:text-5xl">
          {activity.title}
        </h1>
        <p className="text-muted flex flex-wrap items-center gap-x-5 gap-y-2 text-sm md:text-base">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} aria-hidden />
            {activity.start
              ? formatWhen(
                  activity.start,
                  activity.timed,
                  "d MMM yyyy, HH:mm",
                  "d MMM yyyy",
                )
              : isProject(activity)
                ? "Sin fecha meta"
                : "Sin fecha"}
          </span>
          {activity.place ? (
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} aria-hidden />
              {activity.place}
            </span>
          ) : null}
          {activity.format ? <span>{activity.format}</span> : null}
        </p>
        {activity.link ? (
          <a
            href={activity.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-fit"
          >
            Abrir enlace
            <ExternalLink size={16} aria-hidden />
          </a>
        ) : null}
      </header>
      <section
        aria-label="Estadísticas"
        className="grid gap-3 lg:grid-cols-[1.4fr_1fr]"
      >
        <div className="grid grid-cols-3 gap-3">
          <KpiStat label="Tareas" value={String(openTasks.length)} />
          <KpiStat
            label="Avance"
            value={`${view.taskProgress(activity.id)}%`}
          />
          <KpiStat label="Voluntarios" value={String(names.length)} />
        </div>
        <div className="panel-flat flex flex-col justify-center gap-3 px-4 py-3.5">
          <p className="eyebrow">
            {isProject(activity) ? "Avance del proyecto" : "Avance del evento"}
          </p>
          <ProgressBar value={view.taskProgress(activity.id)} />
          <AvatarStack names={names} />
        </div>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <details open className="panel group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-semibold">
              <span>
                Tareas relacionadas
                <span className="badge ml-2 align-middle">
                  {openTasks.length}
                </span>
              </span>
              <ChevronDown
                size={18}
                className="text-muted transition group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="mt-4 grid gap-2.5">
              {actor.role === "admin" || actor.role === "head" ? (
                <Link
                  href={`/tareas/nueva?evento=${activity.id}`}
                  className="btn btn-secondary btn-sm w-fit"
                >
                  <Plus size={15} aria-hidden />
                  Nueva tarea
                </Link>
              ) : null}
              {openTasks.map((task) => (
                <article
                  key={task.id}
                  className="bg-surface-2 flex items-center gap-3 rounded-[16px] px-3.5 py-3"
                >
                  <Avatar
                    name={view.personName(task.assigneeIds[0] ?? "") || "Z"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">
                      <Link
                        href={`/tareas/${task.id}`}
                        className="hover:underline"
                      >
                        {task.title}
                      </Link>
                    </h3>
                    <p className="text-muted mt-0.5 text-sm">
                      {view.personName(task.assigneeIds[0] ?? "")} ·{" "}
                      {view.teamName(task.teamIds[0] ?? "")}
                    </p>
                  </div>
                  <span className="badge shrink-0">
                    {STATUS_LABEL[task.status]}
                  </span>
                </article>
              ))}
              {openTasks.length === 0 ? (
                <p className="text-muted text-sm">
                  {activity.stage === "finished"
                    ? "Las tareas de este evento están archivadas."
                    : "No hay tareas relacionadas."}
                </p>
              ) : null}
            </div>
          </details>
          {archivedTasks.length > 0 ? (
            <details className="panel group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-semibold">
                <span>Archivadas · {archivedTasks.length}</span>
                <ChevronDown
                  size={18}
                  className="text-muted transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="mt-4 grid gap-2.5">
                {archivedTasks.map((task) => (
                  <article
                    key={task.id}
                    className="bg-surface-2 rounded-[16px] px-3.5 py-3"
                  >
                    <h3 className="font-semibold">
                      <Link
                        href={`/tareas/${task.id}`}
                        className="hover:underline"
                      >
                        {task.title}
                      </Link>
                    </h3>
                    <p className="text-muted mt-0.5 text-sm">
                      {STATUS_LABEL[task.status]} · {STAGE_LABEL.finished}
                    </p>
                  </article>
                ))}
              </div>
            </details>
          ) : null}
          <details open className="panel group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-semibold">
              <span>Recursos</span>
              <ChevronDown
                size={18}
                className="text-muted transition group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {resources.length === 0 ? (
                <p className="text-muted text-sm sm:col-span-2">
                  No hay recursos de estos equipos.
                </p>
              ) : (
                resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-surface-2 hover:bg-surface-3 flex items-center justify-between gap-3 rounded-[16px] px-3.5 py-3 font-medium"
                  >
                    <span className="truncate">{resource.title}</span>
                    <ExternalLink
                      size={15}
                      className="text-muted shrink-0"
                      aria-hidden
                    />
                  </a>
                ))
              )}
            </div>
          </details>
        </div>
        <ActivityEditor
          title="Editar actividad"
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
      </div>
    </div>
  );
}
