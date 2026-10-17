"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/(public)/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="grid gap-4">
      <label className="field-label">
        Usuario
        <input
          name="username"
          autoComplete="username"
          required
          className="field h-12 text-base"
        />
      </label>
      <label className="field-label">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field h-12 text-base"
        />
      </label>
      {state && !state.ok ? (
        <p role="alert" className="badge badge-danger w-fit text-sm">
          {state.error.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary h-12 text-base"
      >
        Entrar
      </button>
    </form>
  );
}
