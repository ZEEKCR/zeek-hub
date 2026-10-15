"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveActivityAction,
  trashActivityAction,
  type FormState,
} from "@/app/(app)/eventos/actions";
import { ACTIVITY_TYPES } from "@/server/catalog/options";
import { STAGE_LABEL, STAGE_ORDER } from "@/server/catalog/status";
import type { ActivityStage } from "@/server/domain/types";

const field = "bg-surface-2 h-12 rounded-[14px] px-4";

export function ActivityEditor({
  activity,
  locked,
}: {
  activity?: {
    id: string;
    title: string;
    stage: ActivityStage;
    type: string;
    date?: string;
    notes?: string;
  };
  locked: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveActivityAction,
    null,
  );
  const [trashState, trash, trashPending] = useActionState<FormState, FormData>(
    trashActivityAction,
    null,
  );
  const types = ACTIVITY_TYPES.some((item) => item.id === activity?.type)
    ? [...ACTIVITY_TYPES]
    : activity?.type
      ? [{ id: activity.type, label: activity.type }, ...ACTIVITY_TYPES]
      : [...ACTIVITY_TYPES];
  const stages = STAGE_ORDER.includes(activity?.stage ?? "idea")
    ? STAGE_ORDER
    : activity
      ? [activity.stage, ...STAGE_ORDER]
      : STAGE_ORDER;

  return (
    <div className="grid gap-6">
      <form
        action={action}
        className="bg-surface-1 grid gap-3 rounded-[28px] p-5"
      >
        {activity ? (
          <input type="hidden" name="id" value={activity.id} />
        ) : null}
        <label className="grid gap-1 text-sm font-medium">
          Título
          <input
            name="title"
            required
            maxLength={200}
            defaultValue={activity?.title ?? ""}
            disabled={locked}
            className={field}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Tipo
            <select
              name="type"
              defaultValue={activity?.type ?? "Event"}
              disabled={locked}
              className={field}
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Etapa
            <select
              name="stage"
              defaultValue={activity?.stage ?? "idea"}
              disabled={locked}
              className={field}
            >
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABEL[stage]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Fecha
            <input
              name="date"
              type="date"
              defaultValue={activity?.date ?? ""}
              disabled={locked}
              className={field}
            />
          </label>
        </div>
        <p className="text-muted text-sm">
          Finalizado deja las tareas fuera del tablero. Siguen en Notion.
        </p>
        <label className="grid gap-1 text-sm font-medium">
          Notas
          <textarea
            name="notes"
            maxLength={2000}
            defaultValue={activity?.notes ?? ""}
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
            href="/eventos"
            className="text-muted inline-flex h-12 items-center px-2"
          >
            Volver
          </Link>
        </div>
      </form>
      {activity && !locked ? (
        <form action={trash} className="grid gap-3">
          <input type="hidden" name="id" value={activity.id} />
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
            {trashPending ? "Enviando…" : "Borrar actividad"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
