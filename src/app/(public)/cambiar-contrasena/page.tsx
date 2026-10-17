import { ChangePasswordForm } from "@/app/(public)/cambiar-contrasena/change-password-form";

export default function ChangePasswordPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#161616] px-4">
      <div className="bg-surface-1 border-line shadow-float relative w-full max-w-md overflow-hidden rounded-[32px] border p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,#6335ED,#01E576_80%,transparent_70%)] opacity-70" />
        <p className="flex items-center gap-2 text-sm font-bold tracking-[0.2em]">
          ZEEK
          <span className="bg-accent h-1 w-6 rounded-full" />
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">
          Cambiar contraseña
        </h1>
        <p className="text-muted mt-3 text-sm">
          Se requiere cambiar la contraseña.
        </p>
        <div className="mt-8">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
