"use client";

import { useActionState } from "react";
import {
  addShiftAction,
  shiftAction,
  type AttendanceState,
} from "@/app/(app)/eventos/[id]/asistencia-actions";

/** Join, leave or (for leads) delete one shift, with the reason if it fails. */
export function ShiftControls({
  activityId,
  shiftId,
  mine,
  full,
  canManage,
}: {
  activityId: string;
  shiftId: string;
  mine: boolean;
  full: boolean;
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState<AttendanceState, FormData>(
    shiftAction,
    null,
  );
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="shiftId" value={shiftId} />
      {mine ? (
        <button
          type="submit"
          name="intent"
          value="leave"
          disabled={pending}
          className="btn btn-secondary btn-sm"
        >
          Salirme
        </button>
      ) : (
        <button
          type="submit"
          name="intent"
          value="join"
          disabled={pending || full}
          className="btn btn-primary btn-sm"
        >
          {full ? "Lleno" : "Apuntarme"}
        </button>
      )}
      {canManage ? (
        <button
          type="submit"
          name="intent"
          value="delete"
          disabled={pending}
          className="btn btn-danger btn-sm"
        >
          Borrar
        </button>
      ) : null}
      {state && !state.ok ? (
        <p role="alert" className="text-danger w-full text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function AddShiftForm({ activityId }: { activityId: string }) {
  const [state, action, pending] = useActionState<AttendanceState, FormData>(
    addShiftAction,
    null,
  );
  return (
    <form
      key={state?.ok ? "done" : "editing"}
      action={action}
      className="bg-surface-2 grid gap-3 rounded-[16px] p-4"
    >
      <input type="hidden" name="activityId" value={activityId} />
      <p className="text-sm font-semibold">Nuevo turno</p>
      <label className="field-label">
        Nombre
        <input
          name="title"
          required
          minLength={2}
          maxLength={80}
          placeholder="Ej. Registro de asistentes"
          className="field"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field-label">
          Inicio
          <input
            name="start"
            type="datetime-local"
            required
            className="field"
          />
        </label>
        <label className="field-label">
          Fin
          <input name="end" type="datetime-local" required className="field" />
        </label>
      </div>
      <label className="field-label sm:max-w-40">
        Cupo
        <input
          name="capacity"
          type="number"
          inputMode="numeric"
          min={1}
          max={500}
          defaultValue={5}
          required
          className="field"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-sm"
        >
          {pending ? "Creando…" : "Crear turno"}
        </button>
        {state ? (
          <p
            role="status"
            className={`badge ${state.ok ? "badge-accent" : "badge-danger"}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
      <p className="text-muted text-xs">Las horas son de Costa Rica.</p>
    </form>
  );
}
