"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveActivityAction,
  trashActivityAction,
  type FormState,
} from "@/app/(app)/eventos/actions";
import { ACTIVITY_TYPES } from "@/server/catalog/options";
import {
  COUNTRIES,
  DEFAULT_SCOPE,
  type Scope,
} from "@/server/domain/countries";
import { STAGE_LABEL, STAGE_ORDER } from "@/server/catalog/status";
import type { ActivityStage } from "@/server/domain/types";

const field = "field";

export function ActivityEditor({
  activity,
  locked,
  title: heading,
}: {
  title?: string;
  activity?: {
    id: string;
    title: string;
    stage: ActivityStage;
    type: string;
    date?: string;
    notes?: string;
    country?: Scope;
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
      <form action={action} className="panel grid gap-4">
        {heading ? (
          <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
        ) : null}
        {activity ? (
          <input type="hidden" name="id" value={activity.id} />
        ) : null}
        <label className="field-label">
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
          <label className="field-label">
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
          <label className="field-label">
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
          <label className="field-label">
            País
            <select
              name="country"
              defaultValue={activity?.country ?? DEFAULT_SCOPE}
              disabled={locked}
              className={field}
            >
              <option value="global">Global</option>
              {COUNTRIES.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
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
        <label className="field-label">
          Notas
          <textarea
            name="notes"
            maxLength={2000}
            defaultValue={activity?.notes ?? ""}
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
          <Link href="/eventos" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </form>
      {activity && !locked ? (
        <form action={trash} className="panel-flat grid gap-3 p-4">
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
            className="btn btn-danger w-fit"
          >
            {trashPending ? "Enviando…" : "Borrar actividad"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
