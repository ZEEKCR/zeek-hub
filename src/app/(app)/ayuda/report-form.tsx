"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createReportAction,
  type ReportFormState,
} from "@/app/(app)/ayuda/actions";
import { REPORT_KINDS, REPORT_SCREENS } from "@/server/reports/rules";

export function ReportForm() {
  const [state, action, pending] = useActionState<ReportFormState, FormData>(
    createReportAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(event) => {
        const input = event.currentTarget.elements.namedItem("userAgent");
        if (input instanceof HTMLInputElement) {
          input.value = `${navigator.userAgent} · ${window.innerWidth}x${window.innerHeight}`;
        }
      }}
      className="grid gap-4"
    >
      <input type="hidden" name="userAgent" defaultValue="" />
      <fieldset className="grid gap-2">
        <legend className="field-label mb-1">¿Qué pasa?</legend>
        <div className="flex flex-wrap gap-2">
          {REPORT_KINDS.map((kind, index) => (
            <label
              key={kind.id}
              className="border-line bg-surface-2 has-[:checked]:bg-inverse has-[:checked]:text-bg cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold"
            >
              <input
                type="radio"
                name="kind"
                value={kind.id}
                defaultChecked={index === 0}
                className="sr-only"
              />
              {kind.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field-label">
        Asunto
        <input
          name="subject"
          required
          minLength={3}
          maxLength={120}
          placeholder="Ej. No puedo mover una tarea"
          className="field"
        />
      </label>
      <label className="field-label">
        ¿En qué pantalla pasó?
        <select name="screen" defaultValue="Otra" className="field">
          {REPORT_SCREENS.map((screen) => (
            <option key={screen} value={screen}>
              {screen}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Cuéntanos qué pasó
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={2000}
          placeholder="Qué intentabas hacer, qué esperabas y qué ocurrió."
          className="field"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Enviando…" : "Enviar reporte"}
        </button>
        {state ? (
          <p
            role="status"
            className={`badge w-fit text-sm ${state.ok ? "badge-accent" : "badge-danger"}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
      <p className="text-muted text-xs">
        Junto con tu reporte se guarda tu nombre y el tipo de navegador, para
        poder reproducir el problema.
      </p>
    </form>
  );
}
