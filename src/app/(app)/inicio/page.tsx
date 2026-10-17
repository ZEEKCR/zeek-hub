import Link from "next/link";
import { HeroGradientCard } from "@/components/ui/hero-gradient-card";
import { KpiStat } from "@/components/ui/kpi-stat";
import { QueryChips } from "@/components/ui/query-chips";
import { ScheduleBar } from "@/components/ui/schedule-bar";
import { TaskCard } from "@/components/ui/task-card";
import {
  clockLabel,
  formatCostaRica,
  formatWhen,
  shiftCostaRicaDay,
} from "@/lib/dates";
import { one, searchRecord } from "@/lib/query";
import { requireActor } from "@/server/auth/request";
import {
  assigneeKeys,
  isTodayOrOverdue,
  tasksAssignedTo,
} from "@/server/catalog/focus";
import { loadCatalog } from "@/server/catalog/load";
import { dayKey, todayKey, viewOf } from "@/server/catalog/view";
import { isArchivedTask } from "@/server/catalog/archive";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const view = viewOf(catalog);
  const tasks = catalog.tasks.filter(
    (task) => !isArchivedTask(task, catalog.activities),
  );
  const raw = await searchParams;
  const search = searchRecord(raw);
  const filter = one(raw.filtro) ?? "all";
  const today = todayKey();
  const assigneeIds = assigneeKeys(
    actor.volunteerId,
    actor.notionUserId,
    actor.fullName,
  );
  const linked = assigneeIds.length > 0;
  const mine = tasksAssignedTo(tasks, assigneeIds);
  const focus = mine.filter((task) => isTodayOrOverdue(task, today));
  const open = mine.filter((task) => task.status !== "done");
  const weekEnd = shiftCostaRicaDay(today, 7);
  const weekStart = shiftCostaRicaDay(today, -7);
  const dueWeek = open.filter((task) => {
    const start = task.dueDate?.start;
    if (!start) return false;
    const day = dayKey(start);
    return day >= today && day <= weekEnd;
  });
  const doneMonth = mine.filter(
    (task) =>
      task.status === "done" &&
      dayKey(task.updatedAt).slice(0, 7) === today.slice(0, 7),
  );
  const touched = open.filter(
    (task) => dayKey(task.updatedAt) >= weekStart,
  ).length;
  const doneWeek = doneMonth.filter(
    (task) => dayKey(task.updatedAt) >= weekStart,
  ).length;
  const upcoming = view
    .publishedActivities()
    .filter((activity) => activity.start && dayKey(activity.start) >= today)
    .sort((left, right) => (left.start ?? "").localeCompare(right.start ?? ""));
  const next = upcoming[0];
  const agenda = [
    ...upcoming
      .filter((activity) => activity.start && dayKey(activity.start) === today)
      .map((activity) => ({
        id: activity.id,
        time: clockLabel(activity.start ?? today, activity.timed),
        title: activity.title,
        current: true,
        href: `/eventos/${activity.id}`,
      })),
    ...focus
      .filter(
        (task) => task.dueDate?.start && dayKey(task.dueDate.start) === today,
      )
      .map((task) => ({
        id: task.id,
        time: clockLabel(task.dueDate?.start ?? today, task.dueDate?.timed),
        title: task.title,
        current: false,
        href: "/tareas",
      })),
  ];
  const visible = focus
    .filter((task) => {
      const start = task.dueDate?.start;
      const day = start ? dayKey(start) : "";
      if (filter === "late") return day < today && task.status !== "done";
      if (filter === "today") return day === today;
      if (filter === "progress") return task.status === "in_progress";
      return true;
    })
    .sort((left, right) => rank(left, today) - rank(right, today));
  const lateCount = open.filter((task) => {
    const start = task.dueDate?.start;
    return Boolean(start) && dayKey(start ?? today) < today;
  }).length;
  const notices = [
    next?.start && dayKey(next.start) === today
      ? `${next.title} es hoy.`
      : next
        ? `Próximo evento: ${next.title}.`
        : "",
    lateCount > 0 ? `${lateCount} tareas vencidas.` : "",
  ].filter(Boolean);

  return (
    <div className="grid gap-8">
      <ScheduleBar
        dateLabel={formatCostaRica(new Date(), "d MMM")}
        emptyLabel={
          next
            ? `Sin actividades hoy. Próximo: ${next.title}`
            : "Sin actividades hoy"
        }
        items={agenda}
      />
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold tracking-tight">
        Hola, {actor.displayName}
      </h1>
      {catalog.connected ? null : (
        <p className="text-muted">
          {catalog.notice ??
            "Notion todavía no está conectado en este entorno."}
        </p>
      )}
      {linked ? null : (
        <p className="text-muted">
          Esta cuenta no está enlazada a una persona de Notion.
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiStat
          label="Mis tareas abiertas"
          value={String(open.length)}
          {...(touched > 0 ? { delta: `${touched} esta semana` } : {})}
        />
        <KpiStat label="Vencen esta semana" value={String(dueWeek.length)} />
        <KpiStat label="Próximos eventos" value={String(upcoming.length)} />
        <KpiStat
          label="Tareas Done este mes"
          value={String(doneMonth.length)}
          {...(doneWeek > 0 ? { delta: `${doneWeek} esta semana` } : {})}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        {next ? (
          <Link href={`/eventos/${next.id}`}>
            <HeroGradientCard kicker="Próximo evento" value={next.title}>
              <p className="text-sm text-white/80">
                {next.start
                  ? `${countdown(next.start)} · ${formatWhen(next.start, next.timed, "EEEE d MMM, HH:mm", "EEEE d MMM")} · `
                  : ""}
                avance {view.taskProgress(next.id)}%
              </p>
            </HeroGradientCard>
          </Link>
        ) : null}
        <section className="bg-surface-1 rounded-[28px] p-5">
          <h2 className="text-2xl font-semibold">Avisos</h2>
          {notices.length === 0 ? (
            <p className="text-muted mt-3">No hay avisos nuevos.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {notices.map((notice) => (
                <li key={notice} className="text-sm">
                  {notice}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Mis tareas de hoy</h2>
        <QueryChips
          label="Filtro de tareas"
          pathname="/inicio"
          search={search}
          param="filtro"
          value={filter}
          options={[
            { id: "all", label: "Todas" },
            { id: "late", label: "Vencidas" },
            { id: "today", label: "Hoy" },
            { id: "progress", label: "En progreso" },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((task, index) => (
            <TaskCard
              key={task.id}
              title={task.title}
              meta={
                task.dueDate?.start
                  ? formatWhen(
                      task.dueDate.start,
                      task.dueDate.timed,
                      "d MMM, HH:mm",
                      "d MMM",
                    )
                  : "Sin fecha"
              }
              assignee={view.personName(task.assigneeIds[0] ?? "")}
              team={view.teamName(task.teamIds[0] ?? "")}
              event={view.activityTitle(task.activityIds[0] ?? "")}
              status={task.status}
              {...(task.priority ? { priority: task.priority } : {})}
              active={index === 0}
              href="/tareas"
            />
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="text-muted">No hay tareas en este filtro.</p>
        ) : null}
      </section>
    </div>
  );
}

function rank(
  task: { priority?: string; dueDate?: { start?: string }; status: string },
  today: string,
) {
  const start = task.dueDate?.start;
  const day = start ? dayKey(start) : "9999-99-99";
  const late = start && day < today && task.status !== "done" ? 0 : 1;
  const priority = task.priority === "P0" ? 0 : task.priority === "P1" ? 1 : 2;
  return late * 100_000_000 + Number(day.replaceAll("-", "")) * 10 + priority;
}

function countdown(start: string) {
  const hours = Math.round(
    (new Date(start).getTime() - Date.now()) / 3_600_000,
  );
  if (hours <= 0) return "En curso";
  if (hours < 48) return `Faltan ${hours} h`;
  return `Faltan ${Math.round(hours / 24)} días`;
}
