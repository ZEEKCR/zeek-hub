"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/(public)/cambiar-contrasena/actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        Contraseña actual
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className="bg-surface-2 h-12 rounded-[14px] px-4"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Contraseña nueva
        <input
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="bg-surface-2 h-12 rounded-[14px] px-4"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Confirmar contraseña
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="bg-surface-2 h-12 rounded-[14px] px-4"
        />
      </label>
      <p className="text-muted text-sm">
        Mínimo 12 caracteres. Se puede usar espacios.
      </p>
      {state && !state.ok ? (
        <p className="text-danger text-sm">{state.error.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent h-12 rounded-full font-semibold text-[#161616]"
      >
        Guardar contraseña
      </button>
    </form>
  );
}
