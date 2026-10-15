import Link from "next/link";
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
  const view = one(raw.vista) ?? "lista";
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
  const undated = catalog.tasks.filter((task) => !task.dueDate?.start);
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
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        Calendario
      </h1>
      <QueryChips
        label="Vista"
        pathname="/calendario"
        search={{ ...search, mes: month, dia: selected }}
        param="vista"
        value={view}
        options={[
          { id: "lista", label: "Lista" },
          { id: "semana", label: "Semana" },
          { id: "mes", label: "Mes" },
        ]}
      />
      {view !== "mes" ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {strip.map((day) => (
            <Link
              key={day}
              href={href({ dia: day })}
              className={`grid h-14 min-w-12 shrink-0 place-items-center rounded-full px-3 text-sm font-medium ${
                day === selected ? "bg-accent text-[#161616]" : "bg-surface-1"
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
            className="bg-surface-2 grid h-11 place-items-center rounded-full px-4 text-sm font-medium"
          >
            Anterior
          </Link>
          <p className="text-lg font-semibold capitalize">
            {formatCostaRica(`${month}-01T18:00:00Z`, "MMMM yyyy")}
          </p>
          <Link
            href={href({ mes: shiftCostaRicaMonth(month, 1) })}
            className="bg-surface-2 grid h-11 place-items-center rounded-full px-4 text-sm font-medium"
          >
            Siguiente
          </Link>
        </div>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        {view === "mes" ? (
          <div className="grid grid-cols-7 gap-2">
            {["L", "M", "X", "J", "V", "S", "D"].map((label, index) => (
              <p
                key={`${label}-${index}`}
                className="text-muted text-center text-xs"
              >
                {label}
              </p>
            ))}
            {cells.map((day, index) => {
              const key = day
                ? `${month}-${String(day).padStart(2, "0")}`
                : `empty-${index}`;
              const items = dated.filter((item) => item.day === key);
              return (
                <div
                  key={key}
                  className={`bg-surface-1 min-h-24 rounded-[20px] p-2 ${
                    key === selected ? "ring-accent ring-2" : ""
                  }`}
                >
                  {day ? (
                    <Link
                      href={href({ dia: key })}
                      className={`mb-2 grid size-7 place-items-center rounded-full text-sm ${
                        key === today ? "bg-accent text-[#161616]" : ""
                      }`}
                    >
                      {day}
                    </Link>
                  ) : null}
                  {items.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`mb-1 flex items-center gap-1 truncate rounded-full px-2 py-1 text-xs ${
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
                      {item.title}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <ol className="grid gap-4">
            {[...groups.entries()].map(([day, items]) => (
              <li
                key={day}
                className={
                  day === selected ? "ring-accent rounded-[24px] ring-2" : ""
                }
              >
                <h2 className="px-1 py-2 text-sm font-semibold capitalize">
                  {formatCostaRica(`${day}T18:00:00Z`, "EEEE d MMM")}
                </h2>
                <div className="grid gap-2">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="bg-surface-1 flex items-center justify-between gap-3 rounded-[20px] px-4 py-3"
                    >
                      <span>
                        <span className="flex items-center gap-2 font-semibold">
                          {item.status ? (
                            <span
                              className={`size-2 rounded-full ${DOT[item.status]}`}
                            />
                          ) : null}
                          {item.title}
                        </span>
                        <span className="text-muted text-sm">
                          {item.time
                            ? `${item.time} · ${item.kind}`
                            : item.kind}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
        <aside className="bg-surface-1 rounded-[28px] p-5">
          <h2 className="text-2xl font-semibold capitalize">
            {formatCostaRica(`${selected}T18:00:00Z`, "EEEE d")}
          </h2>
          {dayItems.length === 0 ? (
            <p className="text-muted mt-3 text-sm">Sin actividades este día.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {dayItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="font-medium">
                    {item.title}
                  </Link>
                  <p className="text-muted text-sm">
                    {item.time ? `${item.time} · ${item.kind}` : item.kind}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      <section className="bg-surface-1 rounded-[28px] p-5">
        <h2 className="text-2xl font-semibold">Sin fecha</h2>
        {undated.length === 0 ? (
          <p className="text-muted mt-2">No hay tareas sin fecha.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {undated.map((task) => (
              <li key={task.id}>
                <Link href="/tareas" className="font-medium">
                  {task.title}
                </Link>
                <p className="text-muted text-sm">
                  {catalogView.personName(task.assigneeIds[0] ?? "")} ·{" "}
                  {catalogView.activityTitle(task.activityIds[0] ?? "") ||
                    "Sin evento"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
