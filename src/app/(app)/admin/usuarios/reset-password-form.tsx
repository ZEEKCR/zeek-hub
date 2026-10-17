"use client";

import { useMemo, useState } from "react";
import { resetPasswordAction } from "@/app/(app)/admin/usuarios/actions";
import {
  WelcomeTicket,
  type TicketData,
} from "@/components/tickets/welcome-ticket";

type Person = Omit<TicketData, "password" | "loginUrl" | "kicker">;

export function ResetPasswordForm({
  userId,
  person,
  disabled,
}: {
  userId: string;
  person: Person;
  disabled: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("confirm") !== "yes") {
      setMessage("Marca la casilla para confirmar.");
      return;
    }
    setPending(true);
    setMessage(null);
    setPassword(null);
    try {
      const result = await resetPasswordAction(data);
      if (result.ok) {
        setPassword(result.data.tempPassword);
        setMessage("Contraseña reseteada. Se muestra una sola vez.");
        form.reset();
      } else {
        setMessage(result.error.message);
      }
    } catch {
      setMessage("No se pudo resetear la contraseña.");
    } finally {
      setPending(false);
    }
  }

  const ticket = useMemo<TicketData | null>(() => {
    if (!password) return null;
    return {
      ...person,
      kicker: "Nueva contraseña temporal",
      password,
      loginUrl: `${window.location.origin}/login`,
    };
  }, [password, person]);

  return (
    <div className="grid gap-3">
      <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="userId" value={userId} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="confirm"
            value="yes"
            disabled={disabled}
          />
          Confirmo resetear la contraseña
        </label>
        <button
          type="submit"
          disabled={disabled || pending}
          className="btn btn-secondary btn-sm"
        >
          {pending ? "Reseteando…" : "Resetear contraseña"}
        </button>
        {disabled ? (
          <p className="text-muted w-full text-xs">
            Tu propia contraseña se cambia desde Perfil.
          </p>
        ) : (
          <p className="text-muted w-full text-xs">
            Cierra las sesiones de la persona y le pide una contraseña nueva al
            entrar.
          </p>
        )}
        {message ? (
          <p role="status" className="text-muted w-full text-sm">
            {message}
          </p>
        ) : null}
      </form>
      {password ? (
        <p className="bg-accent rounded-[14px] px-4 py-3 text-sm font-medium text-[#161616]">
          Contraseña temporal: {password}
        </p>
      ) : null}
      {ticket ? <WelcomeTicket data={ticket} /> : null}
    </div>
  );
}
