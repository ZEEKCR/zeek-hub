"use client";

import { CalendarDays, Lock, PartyPopper } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { moveTaskAction } from "@/app/(app)/tareas/actions";
import { Avatar } from "@/components/ui/avatar";
import { confettiBurst } from "@/lib/confetti";
import { prefersReducedMotion } from "@/lib/motion";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { STATUS_LABEL, STATUS_ORDER } from "@/server/catalog/status";
import type { TaskStatus } from "@/server/domain/types";

const STATUS_DOT: Record<TaskStatus, string> = {
  not_started: "bg-muted",
  in_progress: "bg-violet",
  blocked: "bg-danger",
  done: "bg-accent",
};

export type BoardTask = {
  id: string;
  title: string;
  status: TaskStatus;
  meta: string;
  assignee: string;
  team: string;
  event: string;
  priority?: string;
  locked: boolean;
};

/**
 * Renders in the document body so a fixed sheet is always positioned against
 * the screen, whatever transforms or filters the page around it has.
 */
function Portal({ children }: { children: ReactNode }) {
  return typeof document === "undefined"
    ? null
    : createPortal(children, document.body);
}

/**
 * Cards glide to their new spot instead of jumping. The positions are taken
 * right before a move (so scrolling in between does not matter) and compared
 * after React has drawn the result.
 */
function useFlip(items: unknown) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const before = useRef<Map<string, DOMRect> | null>(null);

  useLayoutEffect(() => {
    const previous = before.current;
    before.current = null;
    if (!previous || prefersReducedMotion()) return;
    for (const [id, element] of nodes.current) {
      const from = previous.get(id);
      const to = element.getBoundingClientRect();
      if (!from || from.width === 0 || to.width === 0) continue;
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
      element.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  }, [items]);

  return {
    register: (id: string) => (element: HTMLElement | null) => {
      if (element) nodes.current.set(id, element);
      else nodes.current.delete(id);
    },
    snapshot: () => {
      before.current = new Map(
        [...nodes.current].map(([id, element]) => [
          id,
          element.getBoundingClientRect(),
        ]),
      );
    },
  };
}

export function KanbanBoard({ tasks }: { tasks: BoardTask[] }) {
  const [items, setItems] = useState(tasks);
  const [status, setStatus] = useState<TaskStatus>("not_started");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<{
    id: string;
    all: boolean;
  } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flip = useFlip(items);

  useEffect(
    () => () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    },
    [],
  );

  /** Confetti from the card; a bigger shower when nothing is left to do. */
  function celebrate(id: string, all: boolean) {
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    setCelebrating({ id, all });
    celebrateTimer.current = setTimeout(() => setCelebrating(null), 2600);
    window.setTimeout(() => {
      const card = document.querySelector(`[data-task-id="${CSS.escape(id)}"]`);
      const box = card?.getBoundingClientRect();
      confettiBurst(
        box
          ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
          : { x: window.innerWidth / 2, y: window.innerHeight * 0.6 },
        { count: all ? 40 : 30 },
      );
      if (all) {
        confettiBurst(
          { x: window.innerWidth * 0.2, y: window.innerHeight * 0.75 },
          { count: 50, power: 1.5 },
        );
        confettiBurst(
          { x: window.innerWidth * 0.8, y: window.innerHeight * 0.75 },
          { count: 50, power: 1.5 },
        );
      }
    }, 80);
  }

  async function move(id: string, next: TaskStatus) {
    const current = items.find((task) => task.id === id);
    if (!current || current.locked || current.status === next || pending)
      return;
    const previous = current.status;
    setError(null);
    setPending(true);
    flip.snapshot();
    setItems((rows) =>
      rows.map((task) => (task.id === id ? { ...task, status: next } : task)),
    );
    setStatus(next);
    if (next === "done") {
      const left = items.filter(
        (task) => task.id !== id && task.status !== "done",
      ).length;
      celebrate(id, left === 0);
    }
    try {
      const result = await moveTaskAction(id, next);
      if (!result.ok) {
        if (next === "done") setCelebrating(null);
        setItems((rows) =>
          rows.map((task) =>
            task.id === id && task.status === next
              ? { ...task, status: previous }
              : task,
          ),
        );
        setError(result.message);
      }
    } catch {
      setItems((rows) =>
        rows.map((task) =>
          task.id === id && task.status === next
            ? { ...task, status: previous }
            : task,
        ),
      );
      setError("No se pudo guardar el estado en Notion.");
    } finally {
      setPending(false);
    }
  }

  const columns = STATUS_ORDER.map((column) => ({
    status: column,
    tasks: items.filter((task) => task.status === column),
  }));
  return (
    <div className="grid gap-4">
      <div
        className="bg-surface-1 border-line flex overflow-x-auto rounded-full border p-1 md:hidden"
        role="tablist"
        aria-label="Estado"
      >
        {columns.map((column) => (
          <button
            key={column.status}
            type="button"
            role="tab"
            aria-selected={column.status === status}
            onClick={() => setStatus(column.status)}
            className={`min-h-10 shrink-0 rounded-full px-3.5 text-[0.8125rem] font-semibold ${
              column.status === status
                ? "bg-accent text-[#161616]"
                : "text-muted"
            }`}
          >
            {STATUS_LABEL[column.status]} {column.tasks.length}
          </button>
        ))}
      </div>
      {celebrating ? (
        <Portal>
          <p
            role="status"
            className="toast-pop bg-inverse text-bg fixed bottom-24 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-[var(--shadow-float)] md:bottom-8"
          >
            <PartyPopper size={17} aria-hidden />
            {celebrating.all
              ? "¡Cero pendientes! Buen trabajo"
              : "¡Listo! Tarea completada"}
          </p>
        </Portal>
      ) : null}
      {error ? (
        <p className="badge badge-danger w-fit text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <section
            key={column.status}
            className={`bg-surface-1/60 border-line rounded-[24px] border p-3 transition-colors duration-200 ${
              column.status === status ? "" : "hidden md:block"
            } ${dragId && overColumn === column.status ? "drop-target" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              if (overColumn !== column.status) setOverColumn(column.status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setOverColumn(null);
              }
            }}
            onDrop={(event) => {
              const id = event.dataTransfer.getData("text/plain");
              setOverColumn(null);
              setDragId(null);
              if (id) move(id, column.status);
            }}
          >
            <header className="flex items-center justify-between px-2 py-2.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden
                  className={`size-2.5 rounded-full ${STATUS_DOT[column.status]}`}
                />
                {STATUS_LABEL[column.status]}
              </h2>
              <span className="bg-surface-2 text-muted rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                {column.tasks.length}
              </span>
            </header>
            <div className="grid gap-2.5 md:max-h-[calc(100dvh-20rem)] md:overflow-y-auto md:pr-1">
              {column.tasks.map((task) => (
                <article
                  key={task.id}
                  ref={flip.register(task.id)}
                  data-task-id={task.id}
                  draggable={!task.locked}
                  onDragStart={(event) => {
                    if (task.locked) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.setData("text/plain", task.id);
                    setDragId(task.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverColumn(null);
                  }}
                  className={`bg-surface-2 border-line hover:border-surface-3 rounded-[18px] border p-3 motion-safe:transition ${
                    task.locked ? "" : "md:cursor-grab"
                  } ${celebrating?.id === task.id ? "celebrate" : ""} ${dragId === task.id ? "dragging" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <PriorityBadge
                        {...(task.priority ? { priority: task.priority } : {})}
                      />
                      <h3 className="min-w-0 text-[0.9375rem] leading-snug font-semibold">
                        <Link
                          href={`/tareas/${task.id}`}
                          className="hover:underline"
                        >
                          {task.title}
                        </Link>
                      </h3>
                    </div>
                    {task.locked ? (
                      <Lock
                        size={14}
                        className="text-muted mt-0.5 shrink-0"
                        aria-label="Solo lectura"
                      />
                    ) : null}
                  </div>
                  <p
                    className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${
                      task.meta.startsWith("Venció")
                        ? "text-danger"
                        : "text-muted"
                    }`}
                  >
                    <CalendarDays size={13} aria-hidden />
                    {task.meta}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {task.assignee !== "Sin asignar" ? (
                      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                        <Avatar name={task.assignee} size="sm" />
                        <span className="truncate">{task.assignee}</span>
                      </span>
                    ) : null}
                    {task.team ? (
                      <span className="badge">{task.team}</span>
                    ) : null}
                  </div>
                  {task.event ? (
                    <p className="text-violet-text mt-2 truncate text-xs font-medium">
                      {task.event}
                    </p>
                  ) : null}
                  <select
                    aria-label={`Mover ${task.title}`}
                    className="field mt-3 hidden h-8 min-h-8 rounded-full px-3 text-xs md:block"
                    value={task.status}
                    disabled={task.locked || pending}
                    onChange={(event) =>
                      move(task.id, event.target.value as TaskStatus)
                    }
                  >
                    {STATUS_ORDER.map((option) => (
                      <option key={option} value={option}>
                        {STATUS_LABEL[option]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mt-3 w-full md:hidden"
                    disabled={task.locked || pending}
                    onClick={() => setMovingId(task.id)}
                  >
                    Mover
                  </button>
                </article>
              ))}
              {column.tasks.length === 0 ? (
                <p className="border-line text-muted rounded-[18px] border border-dashed px-3 py-6 text-center text-xs">
                  Sin tareas
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
      {movingId ? (
        <Portal>
          <div
            className="fixed inset-0 z-30 md:hidden"
            role="dialog"
            aria-label="Mover a"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label="Cerrar"
              onClick={() => setMovingId(null)}
            />
            <div className="bg-surface-1 border-line absolute inset-x-0 bottom-0 grid gap-2 rounded-t-[28px] border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <p className="px-2 py-1 font-semibold">Mover a</p>
              {STATUS_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="btn btn-secondary"
                  disabled={pending}
                  onClick={() => {
                    move(movingId, option);
                    setMovingId(null);
                  }}
                >
                  {STATUS_LABEL[option]}
                </button>
              ))}
            </div>
          </div>
        </Portal>
      ) : null}
    </div>
  );
}
