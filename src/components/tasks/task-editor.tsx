"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveTaskAction,
  trashTaskAction,
  type FormState,
} from "@/app/(app)/tareas/actions";
import { PeoplePicker } from "@/components/ui/people-picker";
import { TASK_AREAS } from "@/server/catalog/options";
import { STATUS_ORDER, STATUS_LABEL } from "@/server/catalog/status";
import type { TaskStatus } from "@/server/domain/types";

const field = "field";
const areas: Record<string, string> = {
  Growth: "Growth",
  Logistics: "Logística",
  Volunteers: "Voluntarios",
  Communications: "Comunicaciones",
  Ops: "Operaciones",
  Technical: "Técnico",
  Community: "Comunidad",
  Content: "Contenido",
  Events: "Eventos",
  Services: "Servicios",
  Partners: "Aliados",
  Platform: "Plataforma",
  Blockchain: "Blockchain",
};

export function TaskEditor({
  task,
  activities,
  people,
  locked,
  defaultActivityId,
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
  defaultActivityId?: string;
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
      <form action={action} className="panel grid gap-4">
        {task ? <input type="hidden" name="id" value={task.id} /> : null}
        <label className="field-label">
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
          <label className="field-label">
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
          <label className="field-label">
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
          <label className="field-label">
            Fecha
            <input
              name="due"
              type="date"
              defaultValue={task?.due ?? ""}
              disabled={locked}
              className={field}
            />
          </label>
          <label className="field-label">
            Área
            <select
              name="area"
              defaultValue={task?.area ?? ""}
              disabled={locked}
              className={field}
            >
              <option value="">Sin área</option>
              {[
                ...TASK_AREAS,
                ...(task?.area &&
                !(TASK_AREAS as readonly string[]).includes(task.area)
                  ? [task.area]
                  : []),
              ].map((area) => (
                <option key={area} value={area}>
                  {areas[area] ?? area}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field-label">
          Evento o proyecto
          <select
            name="activityId"
            defaultValue={task?.activityId ?? defaultActivityId ?? ""}
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
        {people.length === 0 ? (
          <p className="text-muted text-sm">Todavía no hay cuentas.</p>
        ) : (
          <PeoplePicker
            name="assignee"
            label="Encargados"
            options={people}
            defaultValue={task?.assignees ?? []}
            disabled={locked}
          />
        )}
        <label className="field-label">
          Notas
          <textarea
            name="notes"
            maxLength={2000}
            defaultValue={task?.notes ?? ""}
            disabled={locked}
            className="field"
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
            className="btn btn-primary"
          >
            {pending ? "Guardando…" : "Guardar en Notion"}
          </button>
          <Link href="/tareas" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </form>
      {task && !locked ? (
        <form action={trash} className="panel-flat grid gap-3 p-4">
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
            className="btn btn-danger w-fit"
          >
            {trashPending ? "Enviando…" : "Borrar tarea"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
