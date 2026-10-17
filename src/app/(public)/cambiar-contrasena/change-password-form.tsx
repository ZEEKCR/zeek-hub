"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/(public)/cambiar-contrasena/actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="grid gap-4">
      <label className="field-label">
        Contraseña actual
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className="field h-12"
        />
      </label>
      <label className="field-label">
        Contraseña nueva
        <input
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="field h-12"
        />
      </label>
      <label className="field-label">
        Confirmar contraseña
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="field h-12"
        />
      </label>
      <p className="text-muted text-sm">
        Mínimo 12 caracteres. Se puede usar espacios.
      </p>
      {state && !state.ok ? (
        <p role="alert" className="badge badge-danger w-fit text-sm">
          {state.error.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary h-12">
        Guardar contraseña
      </button>
    </form>
  );
}
