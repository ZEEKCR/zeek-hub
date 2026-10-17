"use client";

import { Camera } from "lucide-react";
import { useActionState, useRef, useState, startTransition } from "react";
import {
  savePhotoAction,
  type PhotoFormState,
} from "@/app/(app)/perfil/actions";
import { resizeToJpeg } from "@/lib/resize-photo";

export function PhotoForm({ hasPhoto }: { hasPhoto: boolean }) {
  const [state, action, pending] = useActionState<PhotoFormState, FormData>(
    savePhotoAction,
    null,
  );
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    try {
      const jpeg = await resizeToJpeg(file);
      const data = new FormData();
      data.set("photo", new File([jpeg], "foto.jpg", { type: "image/jpeg" }));
      startTransition(() => action(data));
    } catch {
      setProblem("No pudimos leer esa imagen. Prueba con otra foto.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  const message = problem ?? state?.message;
  const ok = !problem && state?.ok;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Elegir foto de perfil"
        onChange={(event) => onPick(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => input.current?.click()}
        className="btn btn-secondary btn-sm"
      >
        <Camera size={15} aria-hidden />
        {pending ? "Subiendo…" : hasPhoto ? "Cambiar foto" : "Subir foto"}
      </button>
      {hasPhoto ? (
        <button
          type="button"
          disabled={pending}
          className="btn btn-sm text-muted"
          onClick={() => {
            const data = new FormData();
            data.set("remove", "1");
            startTransition(() => action(data));
          }}
        >
          Quitar
        </button>
      ) : null}
      {message ? (
        <p
          role="status"
          className={`badge ${ok ? "badge-accent" : "badge-danger"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
