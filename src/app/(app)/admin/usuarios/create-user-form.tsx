"use client";

import { COUNTRIES, DEFAULT_COUNTRY } from "@/server/domain/countries";
import { useActionState, useMemo, useState } from "react";
import { createUserAction } from "@/app/(app)/admin/usuarios/actions";
import {
  WelcomeTicket,
  type TicketData,
} from "@/components/tickets/welcome-ticket";

export function CreateUserForm({
  teams,
  allowRole,
}: {
  teams: { id: string; name: string }[];
  allowRole: boolean;
}) {
  const [state, action, pending] = useActionState(createUserAction, null);
  const [submitted, setSubmitted] = useState<Omit<
    TicketData,
    "password" | "loginUrl"
  > | null>(null);
  const ticket = useMemo<TicketData | null>(() => {
    if (!state?.ok || !state.data.tempPassword || !submitted) return null;
    return {
      ...submitted,
      password: state.data.tempPassword,
      loginUrl: `${window.location.origin}/login`,
    };
  }, [state, submitted]);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const teamId = String(data.get("teamId") ?? "");
        const jobTitle = String(data.get("jobTitle") ?? "").trim();
        setSubmitted({
          name: String(data.get("name") ?? "").trim(),
          username: String(data.get("username") ?? "").trim(),
          department: teams.find((team) => team.id === teamId)?.name ?? "ZEEK",
          ...(jobTitle ? { jobTitle } : {}),
        });
      }}
      className="panel grid gap-3"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Nuevo usuario</h2>
        <p className="text-muted text-sm">
          La contraseña temporal se muestra una sola vez.
        </p>
      </div>
      <input name="username" required placeholder="Usuario" className="field" />
      <input name="name" required placeholder="Nombre" className="field" />
      <input
        name="email"
        type="email"
        placeholder="Correo (opcional)"
        className="field"
      />
      <input name="phone" placeholder="Teléfono (opcional)" className="field" />
      <input
        name="jobTitle"
        maxLength={60}
        placeholder="Nombre de rol (opcional)"
        className="field"
      />
      <label htmlFor="country" className="field-label">
        País
        <select
          id="country"
          name="country"
          className="field"
          defaultValue={DEFAULT_COUNTRY}
        >
          {COUNTRIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {allowRole ? (
        <>
          <label htmlFor="teamId" className="field-label">
            Equipo
            <select
              id="teamId"
              name="teamId"
              className="field"
              defaultValue={teams[0]?.id}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <select
            name="role"
            aria-label="Rol"
            className="field"
            defaultValue="volunteer"
          >
            <option value="volunteer">Voluntario</option>
            <option value="head">Lead</option>
            <option value="admin">Head</option>
          </select>
        </>
      ) : (
        <p className="text-muted text-sm">
          El usuario queda en el equipo propio, con rol de voluntario.
        </p>
      )}
      {state && !state.ok ? (
        <p className="text-danger text-sm">{state.error.message}</p>
      ) : null}
      {state?.ok && state.data.tempPassword ? (
        <p className="bg-accent rounded-[14px] px-4 py-3 text-sm font-medium text-[#161616]">
          Contraseña temporal: {state.data.tempPassword}
        </p>
      ) : null}
      {ticket ? <WelcomeTicket data={ticket} /> : null}
      <button type="submit" disabled={pending} className="btn btn-primary">
        Crear usuario
      </button>
    </form>
  );
}
