"use client";

import { useActionState } from "react";
import { changeRoleAction } from "@/app/(app)/admin/usuarios/actions";
import { ROLE_LABEL, ROLE_ORDER } from "@/server/domain/roles";

export function ChangeRoleForm({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: string;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(changeRoleAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="sr-only" htmlFor={`role-${userId}`}>
        Rol
      </label>
      <select
        id={`role-${userId}`}
        name="role"
        defaultValue={role}
        disabled={disabled}
        className="field h-10 min-h-10 w-auto min-w-40 text-sm"
      >
        {ROLE_ORDER.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABEL[value]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={disabled || pending}
        className="btn btn-secondary btn-sm"
      >
        Guardar rol
      </button>
      {state ? (
        <p role="status" className="text-muted w-full text-sm">
          {state.ok ? state.data.message : state.error.message}
        </p>
      ) : null}
    </form>
  );
}
