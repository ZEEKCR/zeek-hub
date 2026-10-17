"use client";

import { useActionState } from "react";
import { createUserAction } from "@/app/(app)/admin/usuarios/actions";

export function CreateUserForm({
  teams,
  allowRole,
}: {
  teams: { id: string; name: string }[];
  allowRole: boolean;
}) {
  const [state, action, pending] = useActionState(createUserAction, null);
  return (
    <form action={action} className="panel grid gap-3">
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
      <button type="submit" disabled={pending} className="btn btn-primary">
        Crear usuario
      </button>
    </form>
  );
}
