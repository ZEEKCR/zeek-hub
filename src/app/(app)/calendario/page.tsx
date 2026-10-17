import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { QueryChips } from "@/components/ui/query-chips";
import {
  clockLabel,
  costaRicaMonthLength,
  costaRicaWeekStart,
  formatCostaRica,
  shiftCostaRicaDay,
  shiftCostaRicaMonth,
} from "@/lib/dates";
import { one, searchRecord } from "@/lib/query";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { dayKey, todayKey, viewOf } from "@/server/catalog/view";
import { isArchivedTask } from "@/server/catalog/archive";
import type { TaskStatus } from "@/server/domain/types";

type Item = {
  id: string;
  href: string;
  title: string;
  time: string;
  kind: string;
  day: string;
  status?: TaskStatus;
};

function monthParam(value: string | undefined) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return todayKey().slice(0, 7);
}

function dayParam(value: string | undefined, fallback: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return fallback;
}

const DOT: Record<TaskStatus, string> = {
  not_started: "bg-line",
  in_progress: "bg-accent",
  blocked: "bg-danger",
  done: "bg-violet",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireActor();
  const catalog = await loadCatalog();
  const catalogView = viewOf(catalog);
  const raw = await searchParams;
  const search = searchRecord(raw);
  const view = one(raw.vista) ?? "mes";
  const month = monthParam(one(raw.mes));
  const today = todayKey();
  const selected = dayParam(one(raw.dia), today);
  const events = catalogView
    .publishedActivities()
    .filter((activity) => activity.start);
  const dated: Item[] = [
    ...events.map((activity) => ({
      id: activity.id,
      href: `/eventos/${activity.id}`,
      title: activity.title,
      time: clockLabel(activity.start ?? today, activity.timed),
      kind: "evento",
      day: dayKey(activity.start ?? today),
    })),
    ...catalog.tasks.flatMap((task) => {
      if (isArchivedTask(task, catalog.activities)) return [];
      const start = task.dueDate?.start;
      if (!start) return [];
      return [
        {
          id: task.id,
          href: "/tareas",
          title: task.title,
          time: clockLabel(start, task.dueDate?.timed),
          kind: "tarea",
          day: dayKey(start),
          status: task.status,
        },
      ];
    }),
  ];
  const undated = catalog.tasks.filter(
    (task) => !task.dueDate?.start && !isArchivedTask(task, catalog.activities),
  );
  const count = costaRicaMonthLength(month);
  const lead = Number(formatCostaRica(`${month}-01T18:00:00Z`, "i")) - 1;
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ];
  const weekStart = costaRicaWeekStart(selected);
  const weekEnd = shiftCostaRicaDay(weekStart, 6);
  const listed = dated
    .filter((item) => item.day >= weekStart && item.day <= weekEnd)
    .sort(
      (left, right) =>
        left.day.localeCompare(right.day) ||
        left.time.localeCompare(right.time),
    );
  const groups = new Map<string, Item[]>();
  for (const item of listed) {
    const bucket = groups.get(item.day) ?? [];
    bucket.push(item);
    groups.set(item.day, bucket);
  }
  const dayItems = dated.filter((item) => item.day === selected);
  const strip = Array.from({ length: 7 }, (_, index) =>
    shiftCostaRicaDay(weekStart, index),
  );

  function href(next: { vista?: string; mes?: string; dia?: string }) {
    const params = new URLSearchParams();
    params.set("vista", next.vista ?? view);
    params.set("mes", next.mes ?? month);
    const day = next.dia ?? selected;
    if (day) params.set("dia", day);
    return `/calendario?${params}`;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Calendario"
        subtitle="Eventos y fechas de entrega en un solo lugar."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <QueryChips
          label="Vista"
          pathname="/calendario"
          search={{ ...search, mes: month, dia: selected }}
          param="vista"
          value={view}
          options={[
            { id: "mes", label: "Mes" },
            { id: "semana", label: "Semana" },
            { id: "lista", label: "Lista" },
          ]}
        />
        <p className="text-muted flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="bg-violet size-2.5 rounded-full" />
            Evento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-surface-3 size-2.5 rounded-full" />
            Tarea
          </span>
        </p>
      </div>
      {view !== "mes" ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {strip.map((day) => (
            <Link
              key={day}
              href={href({ dia: day })}
              className={`grid h-14 min-w-14 shrink-0 place-items-center rounded-2xl px-3 text-sm font-semibold capitalize ${
                day === selected
                  ? "bg-accent text-[#161616]"
                  : "bg-surface-1 border-line border"
              }`}
            >
              {formatCostaRica(`${day}T18:00:00Z`, "EEE d")}
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <Link
            href={href({ mes: shiftCostaRicaMonth(month, -1) })}
            className="btn btn-secondary btn-sm"
          >
            <ChevronLeft size={16} aria-hidden />
            Anterior
          </Link>
          <p className="text-xl font-semibold capitalize">
            {formatCostaRica(`${month}-01T18:00:00Z`, "MMMM yyyy")}
          </p>
          <Link
            href={href({ mes: shiftCostaRicaMonth(month, 1) })}
            className="btn btn-secondary btn-sm"
          >
            Siguiente
            <ChevronRight size={16} aria-hidden />
          </Link>
        </div>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        {view === "mes" ? (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {["L", "M", "X", "J", "V", "S", "D"].map((label, index) => (
              <p
                key={`${label}-${index}`}
                className="text-muted pb-1 text-center text-xs font-semibold"
              >
                {label}
              </p>
            ))}
            {cells.map((day, index) => {
              const key = day
                ? `${month}-${String(day).padStart(2, "0")}`
                : `empty-${index}`;
              const items = dated.filter((item) => item.day === key);
              if (!day) return <div key={key} aria-hidden />;
              return (
                <div
                  key={key}
                  className={`border-line min-h-16 rounded-2xl border p-1.5 sm:min-h-28 sm:p-2 ${
                    key === selected
                      ? "bg-surface-2 ring-accent ring-2"
                      : "bg-surface-1"
                  }`}
                >
                  <Link
                    href={href({ dia: key })}
                    className={`mb-1 grid size-7 place-items-center rounded-full text-sm font-semibold ${
                      key === today ? "bg-accent text-[#161616]" : "text-muted"
                    }`}
                  >
                    {day}
                  </Link>
                  <div className="hidden sm:block">
                    {items.slice(0, 2).map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`mb-1 flex items-center gap-1.5 truncate rounded-full px-2 py-1 text-xs font-medium ${
                          item.kind === "evento"
                            ? "bg-violet text-on-violet"
                            : "bg-surface-3"
                        }`}
                      >
                        {item.status ? (
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${DOT[item.status]}`}
                          />
                        ) : null}
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
                    {items.length > 2 ? (
                      <p className="text-muted px-1 text-[0.6875rem] font-semibold">
                        +{items.length - 2} más
                      </p>
                    ) : null}
                  </div>
                  {items.length > 0 ? (
                    <div className="flex flex-wrap gap-1 sm:hidden">
                      {items.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className={`size-1.5 rounded-full ${
                            item.kind === "evento" ? "bg-violet" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <ol className="grid gap-5">
            {[...groups.entries()].map(([day, items]) => (
              <li
                key={day}
                className={
                  day === selected ? "ring-accent rounded-[24px] ring-2" : ""
                }
              >
                <h2 className="text-muted px-1 py-2 text-sm font-semibold capitalize">
                  {formatCostaRica(`${day}T18:00:00Z`, "EEEE d MMM")}
                </h2>
                <div className="grid gap-2">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="bg-surface-1 border-line hover:border-surface-3 flex items-center gap-3 rounded-[18px] border px-4 py-3"
                    >
                      <span className="text-muted w-12 shrink-0 text-sm font-semibold tabular-nums">
                        {item.time || "—"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold">
                          {item.status ? (
                            <span
                              className={`size-2 shrink-0 rounded-full ${DOT[item.status]}`}
                            />
                          ) : null}
                          <span className="truncate">{item.title}</span>
                        </span>
                      </span>
                      <span
                        className={`badge ${item.kind === "evento" ? "badge-violet" : ""}`}
                      >
                        {item.kind}
                      </span>
                    </Link>
                  ))}
                </div>
              </li>
            ))}
            {groups.size === 0 ? (
              <EmptyState
                icon={<CalendarDays size={20} aria-hidden />}
                title="No hay actividades en esta semana."
              />
            ) : null}
          </ol>
        )}
        <aside className="panel xl:sticky xl:top-6">
          <p className="eyebrow">Día seleccionado</p>
          <h2 className="mt-1 text-2xl font-semibold capitalize">
            {formatCostaRica(`${selected}T18:00:00Z`, "EEEE d")}
          </h2>
          {dayItems.length === 0 ? (
            <p className="text-muted mt-4 text-sm">Sin actividades este día.</p>
          ) : (
            <ul className="mt-4 grid gap-2.5">
              {dayItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="bg-surface-2 hover:bg-surface-3 block rounded-[16px] px-3.5 py-2.5"
                  >
                    <span className="block font-semibold">{item.title}</span>
                    <span className="text-muted text-sm">
                      {item.time ? `${item.time} · ${item.kind}` : item.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      <Panel title="Sin fecha" description="Tareas sin fecha de entrega.">
        {undated.length === 0 ? (
          <p className="text-muted text-sm">No hay tareas sin fecha.</p>
        ) : (
          <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {undated.map((task) => (
              <li key={task.id}>
                <Link
                  href="/tareas"
                  className="bg-surface-2 hover:bg-surface-3 block rounded-[16px] px-3.5 py-2.5"
                >
                  <span className="block font-semibold">{task.title}</span>
                  <span className="text-muted text-sm">
                    {catalogView.personName(task.assigneeIds[0] ?? "")} ·{" "}
                    {catalogView.activityTitle(task.activityIds[0] ?? "") ||
                      "Sin evento"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
