"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveTaskAction,
  trashTaskAction,
  type FormState,
} from "@/app/(app)/tareas/actions";
import { TASK_AREAS } from "@/server/catalog/options";
import { STATUS_ORDER, STATUS_LABEL } from "@/server/catalog/status";
import type { TaskStatus } from "@/server/domain/types";

const field = "bg-surface-2 h-12 rounded-[14px] px-4";
const areas: Record<string, string> = {
  Community: "Comunidad",
  Platform: "Plataforma",
  Content: "Contenido",
  Ops: "Operaciones",
  Events: "Eventos",
  Services: "Servicios",
  Growth: "Crecimiento",
  Logistics: "Logística",
  Blockchain: "Blockchain",
  Volunteers: "Voluntarios",
  Partners: "Aliados",
};

export function TaskEditor({
  task,
  activities,
  people,
  locked,
}: {
  task?: {
    id: string;
    title: string;
    status: TaskStatus;
    priority?: string;
    due?: string;
    area?: string;
    activityId?: string;
    notes?: string;
    assignees?: string[];
  };
  activities: { id: string; title: string }[];
  people: string[];
  locked: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveTaskAction,
    null,
  );
  const [trashState, trash, trashPending] = useActionState<FormState, FormData>(
    trashTaskAction,
    null,
  );

  return (
    <div className="grid gap-6">
      <form
        action={action}
        className="bg-surface-1 grid gap-3 rounded-[28px] p-5"
      >
        {task ? <input type="hidden" name="id" value={task.id} /> : null}
        <label className="grid gap-1 text-sm font-medium">
          Título
          <input
            name="title"
            required
            maxLength={200}
            defaultValue={task?.title ?? ""}
            disabled={locked}
            className={field}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Estado
            <select
              name="status"
              defaultValue={task?.status ?? "not_started"}
              disabled={locked}
              className={field}
            >
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Prioridad
            <select
              name="priority"
              defaultValue={task?.priority ?? ""}
              disabled={locked}
              className={field}
            >
              <option value="">Sin prioridad</option>
              {["P0", "P1", "P2", "P3"].map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Fecha
            <input
              name="due"
              type="date"
              defaultValue={task?.due ?? ""}
              disabled={locked}
              className={field}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Área
            <select
              name="area"
              defaultValue={task?.area ?? ""}
              disabled={locked}
              className={field}
            >
              <option value="">Sin área</option>
              {TASK_AREAS.map((area) => (
                <option key={area} value={area}>
                  {areas[area] ?? area}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-sm font-medium">
          Evento
          <select
            name="activityId"
            defaultValue={task?.activityId ?? ""}
            disabled={locked}
            className={field}
          >
            <option value="">Sin evento</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="grid gap-2" disabled={locked}>
          <legend className="text-sm font-medium">Encargados</legend>
          {people.length === 0 ? (
            <p className="text-muted text-sm">Todavía no hay cuentas.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {people.map((name) => (
                <label
                  key={name}
                  className="bg-surface-2 flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    name="assignee"
                    value={name}
                    defaultChecked={task?.assignees?.includes(name) ?? false}
                  />
                  {name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <label className="grid gap-1 text-sm font-medium">
          Notas
          <textarea
            name="notes"
            maxLength={2000}
            defaultValue={task?.notes ?? ""}
            disabled={locked}
            className="bg-surface-2 min-h-28 rounded-[14px] px-4 py-3"
          />
        </label>
        {state ? (
          <p role="alert" className="text-danger text-sm">
            {state.message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={locked || pending}
            className="bg-accent h-12 rounded-full px-5 font-medium text-[#161616] disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar en Notion"}
          </button>
          <Link
            href="/tareas"
            className="text-muted inline-flex h-12 items-center px-2"
          >
            Volver
          </Link>
        </div>
      </form>
      {task && !locked ? (
        <form action={trash} className="grid gap-3">
          <input type="hidden" name="id" value={task.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" value="yes" required />
            Enviar a la papelera de Notion
          </label>
          {trashState ? (
            <p role="alert" className="text-danger text-sm">
              {trashState.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={trashPending}
            className="text-danger h-12 w-fit rounded-full px-5 font-medium disabled:opacity-60"
          >
            {trashPending ? "Enviando…" : "Borrar tarea"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
