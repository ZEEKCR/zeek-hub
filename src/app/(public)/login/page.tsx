import { LoginForm } from "@/app/(public)/login/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#161616] px-4">
      <div className="bg-surface-1 shadow-float relative w-full max-w-md overflow-hidden rounded-[32px] p-8">
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,#6335ED,transparent_70%)] opacity-70" />
        <p className="text-sm font-semibold tracking-[0.2em]">ZEEK</p>
        <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold tracking-tight">
          Entrar
        </h1>
        <p className="text-muted mt-3 text-sm">
          El acceso lo crea un líder de equipo o un administrador.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
