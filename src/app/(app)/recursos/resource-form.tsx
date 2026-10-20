"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import {
  createResourceAction,
  type ResourceFormState,
} from "@/app/(app)/recursos/actions";
import { MAX_UPLOAD_BYTES, RESOURCE_TYPES } from "@/server/resources/rules";

export function ResourceForm({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ResourceFormState>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    setState(null);
    setPending(true);
    try {
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_UPLOAD_BYTES) {
          setState({
            ok: false,
            message: `El archivo supera ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
          });
          return;
        }
        setProgress(0);
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/resources/upload",
          onUploadProgress: ({ percentage }) =>
            setProgress(Math.round(percentage)),
        });
        data.set("url", blob.url);
      }
      data.delete("file");
      const result = await createResourceAction(null, data);
      setState(result);
      if (result?.ok) form.reset();
    } catch (error) {
      setState({
        ok: false,
        message: uploadErrorMessage(error),
      });
    } finally {
      setPending(false);
      setProgress(null);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="field-label sm:col-span-2">
        Título
        <input
          name="title"
          required
          minLength={2}
          maxLength={120}
          className="field"
        />
      </label>
      <label className="field-label">
        Archivo
        <input
          name="file"
          type="file"
          className="field file:bg-surface-3 file:mr-3 file:rounded-full file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--text)]"
        />
        <span className="text-muted text-xs font-normal">
          PDF, Office, imágenes, texto o ZIP. Hasta 25 MB.
        </span>
      </label>
      <label className="field-label">
        O enlace
        <input name="url" type="url" placeholder="https://" className="field" />
        <span className="text-muted text-xs font-normal">
          Si subes un archivo, se usa el archivo.
        </span>
      </label>
      <label className="field-label">
        Tipo
        <select name="type" defaultValue="Guía" className="field">
          {RESOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Equipo
        <select name="teamId" defaultValue={teams[0]?.id} className="field">
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Visibilidad
        <select name="visibility" defaultValue="volunteers" className="field">
          <option value="volunteers">Todos los voluntarios</option>
          <option value="core">Solo Head y Lead</option>
        </select>
      </label>
      <label className="field-label">
        Etiquetas
        <input name="tags" placeholder="Separadas por coma" className="field" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending
            ? progress !== null
              ? `Subiendo… ${progress}%`
              : "Guardando…"
            : "Guardar recurso"}
        </button>
        {state ? (
          <p
            role="status"
            className={`badge w-fit text-sm ${state.ok ? "badge-accent" : "badge-danger"}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

/**
 * Vercel Blob answers "Failed to retrieve the client token" when the store is
 * not connected to the project (no BLOB_READ_WRITE_TOKEN). That is a setup
 * step, so the message says what to do instead of showing the English error.
 */
export function uploadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/client token|BLOB_READ_WRITE_TOKEN|No token found/i.test(message)) {
    return "La subida de archivos todavía no está activada en el servidor (falta conectar Vercel Blob). Por ahora pega un enlace en «O enlace» y quita el archivo.";
  }
  return message || "No se pudo subir el archivo.";
}
