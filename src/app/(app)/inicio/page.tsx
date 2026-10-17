import Link from "next/link";
import { ListChecks } from "lucide-react";
import { BirthdayBanner } from "@/components/ui/birthday-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroGradientCard } from "@/components/ui/hero-gradient-card";
import { KpiStat } from "@/components/ui/kpi-stat";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { QueryChips } from "@/components/ui/query-chips";
import { ScheduleBar } from "@/components/ui/schedule-bar";
import { TaskCard } from "@/components/ui/task-card";
import {
  clockLabel,
  formatCostaRica,
  formatWhen,
  shiftCostaRicaDay,
} from "@/lib/dates";
import { greeting, firstName } from "@/lib/greeting";
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
import { assigneeToken } from "@/server/domain/assignee";
import { isProject } from "@/server/domain/projects";
import { listMyShifts } from "@/server/services/attendance";
import { weekAgenda, type WeekItem } from "@/server/catalog/week";
import { listUpcomingBirthdays } from "@/server/services/birthdays";

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
  const birthdaysToday = await listUpcomingBirthdays(actor, today, 0);
  const assigneeIds = assigneeKeys(
    actor.volunteerId,
    actor.notionUserId,
    actor.fullName,
  );
  const linked = assigneeIds.length > 0;
  const mine = tasksAssignedTo(tasks, assigneeIds);
  const nameToken = actor.fullName ? assigneeToken(actor.fullName) : null;
  const nameListed =
    nameToken !== null &&
    catalog.people.some(
      (person) =>
        person.id === nameToken || person.aliasIds.includes(nameToken),
    );
  const nameUnmatched =
    catalog.connected && nameToken !== null && mine.length === 0 && !nameListed;
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
  const myShifts = await listMyShifts(actor, new Date(), daysFromNow(7));
  const week = weekAgenda([
    ...dueWeek.map<WeekItem>((task) => ({
      id: task.id,
      kind: "tarea",
      title: task.title,
      detail: "Vence",
      at: task.dueDate?.start ?? today,
      day: dayKey(task.dueDate?.start ?? today),
      timed: task.dueDate?.timed === true,
      href: `/tareas/${task.id}`,
    })),
    ...myShifts.map<WeekItem>((shift) => ({
      id: shift.id,
      kind: "turno",
      title: shift.title,
      detail: `${view.activityTitle(shift.activityId) || "Evento"} · ${formatCostaRica(shift.startsAt, "HH:mm")}–${formatCostaRica(shift.endsAt, "HH:mm")}`,
      at: shift.startsAt.toISOString(),
      day: formatCostaRica(shift.startsAt, "yyyy-MM-dd"),
      timed: true,
      href: `/eventos/${shift.activityId}`,
    })),
  ]);
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
    .filter(
      (activity) =>
        !isProject(activity) &&
        activity.start &&
        dayKey(activity.start) >= today,
    )
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
    <div className="grid gap-6">
      <ScheduleBar
        dateLabel={formatCostaRica(new Date(), "d MMM")}
        emptyLabel={
          next
            ? `Sin actividades hoy. Próximo: ${next.title}`
            : "Sin actividades hoy"
        }
        items={agenda}
      />
      <PageHeader
        kicker={formatCostaRica(new Date(), "EEEE d MMMM")}
        title={`${greeting(new Date())}, ${firstName(actor.fullName || actor.displayName)}`}
        subtitle="Esto es lo que tienes pendiente y lo que viene en el calendario."
      />
      <BirthdayBanner people={birthdaysToday} selfId={actor.userId} />
      {catalog.connected ? null : (
        <Notice>
          {catalog.notice ??
            "Notion todavía no está conectado en este entorno."}
        </Notice>
      )}
      {nameUnmatched ? (
        <Notice>
          «{actor.fullName}» no aparece en la columna Encargado de ninguna
          tarea. Si te asignaron tareas y no las ves, pide a un admin que
          corrija tu nombre en Usuarios.
        </Notice>
      ) : null}
      {linked ? null : (
        <Notice>Esta cuenta no está enlazada a una persona de Notion.</Notice>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel
          title="Mis tareas de hoy"
          description="Ordenadas por urgencia y prioridad."
        >
          <div className="grid gap-4">
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
            <div className="grid gap-3">
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
              <EmptyState
                icon={<ListChecks size={20} aria-hidden />}
                title="No hay tareas en este filtro."
              />
            ) : null}
          </div>
        </Panel>
        <div className="grid gap-6">
          {next ? (
            <Link href={`/eventos/${next.id}`} className="block">
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
          <Panel
            title="Mi semana"
            description="Lo que vence y tus turnos en los próximos 7 días."
          >
            {week.length === 0 ? (
              <p className="text-muted text-sm">
                Nada urgente esta semana. ¡Buen momento para adelantar algo!
              </p>
            ) : (
              <ul className="grid gap-2">
                {week.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      href={item.href}
                      className="bg-surface-2 hover:bg-surface-3 flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 transition-colors"
                    >
                      <span
                        className={`badge shrink-0 ${item.kind === "turno" ? "badge-violet" : ""}`}
                      >
                        {formatCostaRica(`${item.day}T18:00:00Z`, "EEE d")}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {item.title}
                        </span>
                        <span className="text-muted block truncate text-xs">
                          {item.kind === "turno" ? "Turno · " : ""}
                          {item.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Avisos">
            {notices.length === 0 ? (
              <p className="text-muted text-sm">No hay avisos nuevos.</p>
            ) : (
              <ul className="grid gap-2.5">
                {notices.map((notice) => (
                  <li
                    key={notice}
                    className="bg-surface-2 rounded-[14px] px-3.5 py-2.5 text-sm"
                  >
                    {notice}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
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

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000);
}
