"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";

/** An error inside the app keeps the menu, and offers a way forward. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div className="grid max-w-md justify-items-center gap-3">
        <h1 className="text-3xl font-semibold">Algo salió mal</h1>
        <p className="text-muted">
          No pudimos cargar esta pantalla. Tus datos están a salvo. Prueba de
          nuevo y, si sigue igual, cuéntanos en Ayuda.
        </p>
        {error.digest ? (
          <p className="text-muted text-xs">
            Código del incidente: {error.digest}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw size={16} aria-hidden />
            Intentar de nuevo
          </button>
          <Link href="/inicio" className="btn btn-secondary">
            Ir a Inicio
          </Link>
          <Link href="/ayuda" className="btn btn-secondary">
            Pedir ayuda
          </Link>
        </div>
      </div>
    </div>
  );
}
