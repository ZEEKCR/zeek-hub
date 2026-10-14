"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/(public)/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        Usuario
        <input
          name="username"
          autoComplete="username"
          required
          className="bg-surface-2 h-12 rounded-[14px] px-4 text-base"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="bg-surface-2 h-12 rounded-[14px] px-4 text-base"
        />
      </label>
      {state && !state.ok ? (
        <p className="text-danger text-sm">{state.error.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent h-12 rounded-full text-base font-semibold text-[#161616] disabled:opacity-60"
      >
        Entrar
      </button>
    </form>
  );
}
