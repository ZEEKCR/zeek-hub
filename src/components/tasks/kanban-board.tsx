"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { moveTaskAction } from "@/app/(app)/tareas/actions";
import { STATUS_LABEL, STATUS_ORDER } from "@/server/catalog/status";
import type { TaskStatus } from "@/server/domain/types";

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

export function KanbanBoard({ tasks }: { tasks: BoardTask[] }) {
  const [items, setItems] = useState(tasks);
  const [status, setStatus] = useState<TaskStatus>("not_started");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(id: string, next: TaskStatus) {
    const current = items.find((task) => task.id === id);
    if (!current || current.locked || current.status === next || pending)
      return;
    const previous = current.status;
    setError(null);
    setPending(true);
    setItems((rows) =>
      rows.map((task) => (task.id === id ? { ...task, status: next } : task)),
    );
    setStatus(next);
    try {
      const result = await moveTaskAction(id, next);
      if (!result.ok) {
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
        className="bg-inverse flex overflow-x-auto rounded-full p-1 md:hidden"
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
            className={`min-h-11 shrink-0 rounded-full px-3 text-sm font-medium ${
              column.status === status
                ? "bg-accent text-[#161616]"
                : "text-[#161616]"
            }`}
          >
            {STATUS_LABEL[column.status]} {column.tasks.length}
          </button>
        ))}
      </div>
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        {columns.map((column) => (
          <section
            key={column.status}
            className={`bg-surface-3 rounded-[28px] p-3 ${
              column.status === status ? "" : "hidden md:block"
            }`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData("text/plain");
              if (id) move(id, column.status);
            }}
          >
            <header className="sticky top-0 flex items-center justify-between px-2 py-3">
              <h2 className="font-semibold">{STATUS_LABEL[column.status]}</h2>
              <span className="bg-surface-1 rounded-full px-2 py-1 text-xs tabular-nums">
                {column.tasks.length}
              </span>
            </header>
            <div className="grid gap-3">
              {column.tasks.map((task) => (
                <article
                  key={task.id}
                  draggable={!task.locked}
                  onDragStart={(event) => {
                    if (task.locked) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.setData("text/plain", task.id);
                  }}
                  className="bg-surface-1 shadow-card rounded-[20px] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">
                      {task.priority === "P0" || task.priority === "P1" ? (
                        <span className="bg-danger mr-2 inline-block size-2 rounded-full" />
                      ) : null}
                      <Link
                        href={`/tareas/${task.id}`}
                        className="hover:underline"
                      >
                        {task.title}
                      </Link>
                    </h3>
                    {task.locked ? (
                      <Lock size={14} aria-label="Solo lectura" />
                    ) : null}
                  </div>
                  <p className="text-muted mt-1 text-sm">
                    {[
                      task.meta,
                      task.assignee !== "Sin asignar" ? task.assignee : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <select
                    aria-label={`Mover ${task.title}`}
                    className="bg-surface-2 mt-3 hidden h-9 w-full rounded-full px-3 text-sm md:block"
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
                    className="bg-surface-2 mt-3 h-9 w-full rounded-full text-sm md:hidden"
                    disabled={task.locked || pending}
                    onClick={() => setMovingId(task.id)}
                  >
                    Mover
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      {movingId ? (
        <div
          className="fixed inset-0 z-30 md:hidden"
          role="dialog"
          aria-label="Mover a"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar"
            onClick={() => setMovingId(null)}
          />
          <div className="bg-surface-1 absolute inset-x-0 bottom-0 grid gap-2 rounded-t-[28px] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="px-2 py-1 font-semibold">Mover a</p>
            {STATUS_ORDER.map((option) => (
              <button
                key={option}
                type="button"
                className="bg-surface-2 h-11 rounded-full text-sm font-medium"
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
      ) : null}
    </div>
  );
}
