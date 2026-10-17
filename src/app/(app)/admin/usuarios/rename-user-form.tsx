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
    <form action={action} className="flex flex-wrap items-center gap-2">
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
        className="field h-10 min-h-10 min-w-0 flex-1 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="btn btn-secondary btn-sm"
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
