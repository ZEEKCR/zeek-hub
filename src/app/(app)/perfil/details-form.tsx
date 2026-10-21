"use client";

import { useActionState } from "react";
import {
  saveDetailsAction,
  type DetailsFormState,
} from "@/app/(app)/perfil/actions";
import { MONTH_NAMES, type Birthday } from "@/server/birthdays/rules";

/** The profile grid: what a Head sets is read-only, the rest the person edits. */
export function DetailsForm({
  fixed,
  email,
  phone,
  birthday,
}: {
  fixed: { label: string; value: string | undefined }[];
  email: string;
  phone: string;
  birthday: Birthday | null;
}) {
  const [state, action, pending] = useActionState<DetailsFormState, FormData>(
    saveDetailsAction,
    null,
  );
  return (
    <form
      key={`${email}|${phone}|${birthday?.month ?? 0}-${birthday?.day ?? 0}`}
      action={action}
      className="mt-5 grid gap-3"
    >
      <div className="border-line grid gap-px overflow-hidden rounded-[16px] border sm:grid-cols-2">
        {fixed.map((item) => (
          <div key={item.label} className="bg-surface-2 px-4 py-3">
            <p className="text-muted text-xs font-semibold">{item.label}</p>
            <p className="mt-0.5 truncate text-sm font-medium">
              {item.value || "Sin asignar"}
            </p>
          </div>
        ))}
        <label className="bg-surface-2 grid gap-1 px-4 py-3">
          <span className="text-muted text-xs font-semibold">Correo</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={120}
            defaultValue={email}
            placeholder="tu@correo.com"
            className="field h-9 px-3 text-sm"
          />
        </label>
        <label className="bg-surface-2 grid gap-1 px-4 py-3">
          <span className="text-muted text-xs font-semibold">Teléfono</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            defaultValue={phone}
            placeholder="+506 8888 8888"
            className="field h-9 px-3 text-sm"
          />
        </label>
        <fieldset className="bg-surface-2 grid gap-1 px-4 py-3">
          <legend className="text-muted text-xs font-semibold">
            Cumpleaños
          </legend>
          <div className="grid grid-cols-[1fr_4.5rem] gap-2">
            <select
              name="month"
              aria-label="Mes"
              defaultValue={birthday?.month ?? ""}
              className="field h-9 px-3 text-sm"
            >
              <option value="">Mes</option>
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </option>
              ))}
            </select>
            <input
              name="day"
              type="number"
              inputMode="numeric"
              aria-label="Día"
              min={1}
              max={31}
              placeholder="Día"
              defaultValue={birthday?.day ?? ""}
              className="field h-9 px-3 text-sm"
            />
          </div>
        </fieldset>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
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
        Departamento, país y rol los actualiza un Head desde Usuarios. El correo
        y el teléfono solo los ven tu equipo y los Head. Del cumpleaños solo
        guardamos día y mes, y todo el equipo verá el aviso en Inicio.
      </p>
    </form>
  );
}
