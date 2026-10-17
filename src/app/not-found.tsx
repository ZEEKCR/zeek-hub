import Image from "next/image";

export default function NotFound() {
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
        <h1 className="text-4xl font-semibold">Página no encontrada</h1>
        <p className="text-muted mt-2">
          El enlace no corresponde a una pantalla de ZEEK Hub.
        </p>
      </div>
    </main>
  );
}
