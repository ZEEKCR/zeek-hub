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
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="sr-only" htmlFor={`role-${userId}`}>
        Rol
      </label>
      <select
        id={`role-${userId}`}
        name="role"
        defaultValue={role}
        disabled={disabled}
        className="bg-surface-2 h-10 rounded-[14px] px-3 text-sm"
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
        className="bg-surface-2 h-10 rounded-full px-4 text-sm font-medium disabled:opacity-60"
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
