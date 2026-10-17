"use client";

import { useActionState } from "react";
import { renameUserAction } from "@/app/(app)/admin/usuarios/actions";

export function RenameUserForm({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(renameUserAction, null);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="sr-only" htmlFor={`name-${userId}`}>
        Nombre completo
      </label>
      <input
        id={`name-${userId}`}
        name="name"
        required
        defaultValue={name}
        placeholder="Nombre completo"
        className="bg-surface-2 h-10 min-w-0 flex-1 rounded-[14px] px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-surface-2 h-10 rounded-full px-4 text-sm font-medium"
      >
        Guardar nombre
      </button>
      {state ? (
        <p role="status" className="text-muted w-full text-sm">
          {state.ok ? state.data.message : state.error.message}
        </p>
      ) : null}
    </form>
  );
}
