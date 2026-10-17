"use client";

import { useActionState } from "react";
import {
  saveBirthdayAction,
  type BirthdayFormState,
} from "@/app/(app)/perfil/actions";
import { MONTH_NAMES, type Birthday } from "@/server/birthdays/rules";

export function BirthdayForm({ current }: { current: Birthday | null }) {
  const [state, action, pending] = useActionState<BirthdayFormState, FormData>(
    saveBirthdayAction,
    null,
  );
  return (
    <form
      key={`${current?.month ?? 0}-${current?.day ?? 0}`}
      action={action}
      className="grid gap-3"
    >
      <div className="grid grid-cols-[1fr_5.5rem] gap-3">
        <label className="field-label">
          Mes
          <select
            name="month"
            defaultValue={current?.month ?? ""}
            required
            className="field"
          >
            <option value="" disabled>
              Mes
            </option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Día
          <input
            name="day"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            defaultValue={current?.day ?? ""}
            required
            className="field"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {current ? (
          <button
            type="submit"
            name="remove"
            value="1"
            formNoValidate
            disabled={pending}
            className="btn btn-secondary"
          >
            Quitar
          </button>
        ) : null}
        {state ? (
          <p
            role="status"
            className={`badge text-sm ${state.ok ? "badge-accent" : "badge-danger"}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
      <p className="text-muted text-xs">
        Solo guardamos el día y el mes, nunca el año. Todo el equipo verá el
        aviso en Inicio.
      </p>
    </form>
  );
}
