import Image from "next/image";
import { LoginForm } from "@/app/(public)/login/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#161616] px-4">
      <div className="bg-surface-1 border-line shadow-float relative w-full max-w-md overflow-hidden rounded-[32px] border p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,#6335ED,transparent_70%)] opacity-70" />
        <Image
          src="/brand/zeek-logo.png"
          alt="ZEEK"
          width={960}
          height={349}
          priority
          className="h-10 w-auto"
        />
        <h1 className="mt-6 text-4xl leading-none font-semibold tracking-tight">
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
