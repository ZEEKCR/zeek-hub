"use client";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main className="bg-bg grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-semibold">Algo salió mal</h1>
        <p className="text-muted mt-2">
          No se pudo cargar esta pantalla. Intentar de nuevo.
        </p>
        {error.digest ? (
          <p className="text-muted mt-2 text-xs">Incidente {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
