import { acceptPrivacyAction } from "@/app/(public)/privacidad/actions";

export default function PrivacyPage() {
  return (
    <main className="bg-bg grid min-h-dvh place-items-center px-4">
      <article className="bg-surface-1 shadow-card w-full max-w-2xl rounded-[32px] p-8">
        <p className="text-sm font-semibold tracking-[0.2em]">ZEEK</p>
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
          <button
            type="submit"
            className="bg-accent h-12 rounded-full px-6 font-semibold text-[#161616]"
          >
            Aceptar y continuar
          </button>
        </form>
      </article>
    </main>
  );
}
