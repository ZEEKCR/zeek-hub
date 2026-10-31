"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createSuggestionAction,
  type SuggestionFormState,
} from "@/app/(app)/eventos/sugerir/actions";
import { COUNTRIES, type CountryId } from "@/server/domain/countries";
import { SUGGESTION_KINDS } from "@/server/suggestions/rules";

export function SuggestionForm({ country }: { country: CountryId }) {
  const [state, action, pending] = useActionState<
    SuggestionFormState,
    FormData
  >(createSuggestionAction, null);
  const [kind, setKind] = useState<string>("idea");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="panel grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="field-label mb-1">¿Qué quieres sugerir?</legend>
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_KINDS.map((item) => (
            <label
              key={item.id}
              className="border-line bg-surface-2 has-[:checked]:bg-inverse has-[:checked]:text-bg cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold"
            >
              <input
                type="radio"
                name="kind"
                value={item.id}
                checked={kind === item.id}
                onChange={() => setKind(item.id)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field-label">
        {kind === "idea"
          ? "Nombre de la idea"
          : "¿Qué te gustaría hacer con esa persona?"}
        <input
          name="title"
          required
          minLength={3}
          maxLength={120}
          placeholder={
            kind === "idea"
              ? "Ej. Ideathon de tecnología para jóvenes"
              : "Ej. Charla con una fundadora de startups"
          }
          className="field"
        />
      </label>
      {kind === "contacto" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field-label">
            Persona o grupo
            <input
              name="contactName"
              required
              maxLength={80}
              placeholder="Nombre de quien quiere colaborar"
              className="field"
            />
          </label>
          <label className="field-label">
            Cómo contactarle (opcional)
            <input
              name="contactInfo"
              maxLength={160}
              placeholder="Correo, teléfono o red social"
              className="field"
            />
          </label>
        </div>
      ) : null}
      <label className="field-label">
        Cuéntanos más
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={2000}
          placeholder={
            kind === "idea"
              ? "De qué se trata, a quién iría dirigido y por qué crees que sería buena idea."
              : "Cómo la conociste, qué propone y cualquier detalle que ayude a darle seguimiento."
          }
          className="field"
        />
      </label>
      <label className="field-label sm:max-w-xs">
        ¿Para qué país?
        <select name="country" defaultValue={country} className="field">
          <option value="global">Global</option>
          {COUNTRIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Enviando…" : "Enviar sugerencia"}
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
    </form>
  );
}
