"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/(app)/admin/usuarios/actions";

const field = "bg-surface-2 h-10 min-w-0 rounded-[14px] px-3 text-sm";

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
    <form action={action} className="mt-3 grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="grid gap-1 text-xs font-medium">
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
      <label className="grid gap-1 text-xs font-medium">
        Nombre de rol
        <input
          name="jobTitle"
          maxLength={60}
          defaultValue={jobTitle}
          placeholder="Ej. Head de Growth"
          className={field}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Correo
        <input
          name="email"
          type="email"
          defaultValue={email}
          placeholder="correo@ejemplo.com"
          className={field}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium">
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
          className="bg-surface-2 h-10 rounded-full px-4 text-sm font-medium disabled:opacity-60"
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
