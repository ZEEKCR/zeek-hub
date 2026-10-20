"use client";

import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MAX_AGREEMENT_BYTES } from "@/server/agreements/rules";

/** Picks a PDF and sends it. `userId` is only used by a Head uploading for someone else. */
export function AgreementUploader({
  userId,
  label,
  compact = false,
}: {
  userId?: string;
  label: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  async function send(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_AGREEMENT_BYTES) {
      setMessage({
        ok: false,
        text: "El archivo pesa más de 4 MB. Comprime el PDF e inténtalo de nuevo.",
      });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      if (userId) form.set("userId", userId);
      const response = await fetch("/api/agreement", {
        method: "POST",
        body: form,
      });
      const body = (await response.json().catch(() => null)) as {
        ok: boolean;
        message?: string;
      } | null;
      if (!response.ok || !body?.ok) {
        setMessage({
          ok: false,
          text:
            body?.message ?? "No se pudo subir el archivo. Inténtalo de nuevo.",
        });
        return;
      }
      setMessage({ ok: true, text: "Listo, el acuerdo quedó guardado." });
      router.refresh();
    } catch {
      setMessage({
        ok: false,
        text: "No se pudo subir el archivo. Revisa tu conexión.",
      });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label={label}
        onChange={(event) => send(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className={`btn ${compact ? "btn-secondary btn-sm" : "btn-primary"}`}
      >
        <FileUp size={compact ? 15 : 17} aria-hidden />
        {busy ? "Subiendo…" : label}
      </button>
      {message ? (
        <p
          role="status"
          className={`badge ${message.ok ? "badge-accent" : "badge-danger"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
