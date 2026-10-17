import { acceptPrivacyAction } from "@/app/(public)/privacidad/actions";

export default function PrivacyPage() {
  return (
    <main className="bg-bg grid min-h-dvh place-items-center px-4">
      <article className="bg-surface-1 border-line shadow-card w-full max-w-2xl rounded-[32px] border p-6 sm:p-8">
        <p className="flex items-center gap-2 text-sm font-bold tracking-[0.2em]">
          ZEEK
          <span className="bg-accent h-1 w-6 rounded-full" />
        </p>
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
