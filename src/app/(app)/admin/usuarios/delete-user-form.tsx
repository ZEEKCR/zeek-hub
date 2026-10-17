"use client";

import { useActionState } from "react";
import { deleteUserAction } from "@/app/(app)/admin/usuarios/actions";

export function DeleteUserForm({
  userId,
  disabled,
}: {
  userId: string;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(deleteUserAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="userId" value={userId} />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="confirm"
          value="yes"
          disabled={disabled}
          required
        />
        Confirmo eliminar esta cuenta
      </label>
      <button
        type="submit"
        disabled={disabled || pending}
        className="btn btn-danger btn-sm"
      >
        {pending ? "Eliminando…" : "Eliminar usuario"}
      </button>
      {state ? (
        <p role="status" className="text-muted w-full text-sm">
          {state.ok ? state.data.message : state.error.message}
        </p>
      ) : null}
    </form>
  );
}
