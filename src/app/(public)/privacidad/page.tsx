import { PRIVACY_EMAIL } from "@/lib/links";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { acceptPrivacyAction } from "@/app/(public)/privacidad/actions";

export default function PrivacyPage() {
  return (
    <main className="bg-bg grid min-h-dvh place-items-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="icon" />
      </div>
      <article className="bg-surface-1 border-line shadow-card w-full max-w-2xl rounded-[32px] border p-6 sm:p-8">
        <BrandLogo className="h-10 w-auto" />
        <h1 className="mt-4 text-4xl font-semibold">Aviso de privacidad</h1>
        <p className="text-muted mt-4 text-base leading-7">
          ZEEK Hub guarda nombre, usuario, correo opcional, teléfono opcional,
          foto opcional, rol y equipo para coordinar el voluntariado. Teléfono y
          correo de otras personas solo los ve el propio equipo y los
          administradores. Los datos se procesan en Notion, Neon, Vercel,
          Upstash y Sentry, fuera de Costa Rica. Si subes tu acuerdo de
          voluntariado firmado, se guarda en nuestra base de datos y solo lo ven
          tú y los Head. Para pedir acceso, rectificación o supresión de tus
          datos, escribe a{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-violet-text font-semibold underline underline-offset-2"
          >
            {PRIVACY_EMAIL}
          </a>
          .
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
