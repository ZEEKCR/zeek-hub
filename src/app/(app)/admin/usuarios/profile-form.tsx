"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/(app)/admin/usuarios/actions";

const field = "field h-10 min-h-10 min-w-0 text-sm";

export function ProfileForm({
  userId,
  teams,
  teamId,
  jobTitle,
  email,
  phone,
}: {
  userId: string;
  teams: { id: string; name: string }[];
  teamId: string;
  jobTitle: string;
  email: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="field-label">
        Departamento
        <select name="teamId" defaultValue={teamId} className={field}>
          {teamId === "" ? <option value="">Sin departamento</option> : null}
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Nombre de rol
        <input
          name="jobTitle"
          maxLength={60}
          defaultValue={jobTitle}
          placeholder="Ej. Head de Growth"
          className={field}
        />
      </label>
      <label className="field-label">
        Correo
        <input
          name="email"
          type="email"
          defaultValue={email}
          placeholder="correo@ejemplo.com"
          className={field}
        />
      </label>
      <label className="field-label">
        Teléfono
        <input
          name="phone"
          defaultValue={phone}
          placeholder="+506 8888 8888"
          className={field}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-secondary btn-sm"
        >
          Guardar perfil
        </button>
        {state ? (
          <p role="status" className="text-muted text-sm">
            {state.ok ? state.data.message : state.error.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
