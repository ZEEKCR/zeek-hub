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
    <form
      action={action}
      className="bg-surface-1 grid gap-3 rounded-[28px] p-5"
    >
      <h2 className="text-xl font-semibold">Nuevo usuario</h2>
      <input
        name="username"
        required
        placeholder="Usuario"
        className="bg-surface-2 h-12 rounded-[14px] px-4"
      />
      <input
        name="name"
        required
        placeholder="Nombre"
        className="bg-surface-2 h-12 rounded-[14px] px-4"
      />
      <input
        name="email"
        type="email"
        placeholder="Correo (opcional)"
        className="bg-surface-2 h-12 rounded-[14px] px-4"
      />
      <input
        name="phone"
        placeholder="Teléfono (opcional)"
        className="bg-surface-2 h-12 rounded-[14px] px-4"
      />
      {allowRole ? (
        <>
          <label htmlFor="teamId" className="grid gap-1 text-sm font-medium">
            Equipo
            <select
              id="teamId"
              name="teamId"
              className="bg-surface-2 h-12 rounded-[14px] px-4"
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
            className="bg-surface-2 h-12 rounded-[14px] px-4"
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
      <button
        type="submit"
        disabled={pending}
        className="bg-accent h-12 rounded-full font-semibold text-[#161616]"
      >
        Crear usuario
      </button>
    </form>
  );
}
