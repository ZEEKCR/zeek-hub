"use client";

import Image from "next/image";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main className="bg-bg grid min-h-dvh place-items-center px-4 text-center">
      <div className="grid justify-items-center">
        <Image
          src="/brand/zeek-mark.png"
          alt="ZEEK"
          width={182}
          height={240}
          className="mb-5 h-14 w-auto"
        />
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
