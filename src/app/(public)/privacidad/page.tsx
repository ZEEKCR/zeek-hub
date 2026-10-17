import Image from "next/image";
import { acceptPrivacyAction } from "@/app/(public)/privacidad/actions";

export default function PrivacyPage() {
  return (
    <main className="bg-bg grid min-h-dvh place-items-center px-4">
      <article className="bg-surface-1 border-line shadow-card w-full max-w-2xl rounded-[32px] border p-6 sm:p-8">
        <Image
          src="/brand/zeek-logo.png"
          alt="ZEEK"
          width={960}
          height={349}
          priority
          className="h-10 w-auto"
        />
        <h1 className="mt-4 text-4xl font-semibold">Aviso de privacidad</h1>
        <p className="text-muted mt-4 text-base leading-7">
          ZEEK Hub guarda nombre, usuario, correo opcional, teléfono opcional,
          foto opcional, rol y equipo para coordinar el voluntariado. Teléfono y
          correo de otras personas solo los ve el propio equipo y los
          administradores. Los datos se procesan en Notion, Neon, Vercel,
          Upstash y Sentry, fuera de Costa Rica. El correo de contacto para
          acceso, rectificación o supresión está pendiente de definir.
        </p>
        <form action={acceptPrivacyAction} className="mt-8">
          <button type="submit" className="btn btn-primary h-12 px-6">
            Aceptar y continuar
          </button>
        </form>
      </article>
    </main>
  );
}
