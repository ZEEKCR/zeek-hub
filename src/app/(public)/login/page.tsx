import { LoginForm } from "@/app/(public)/login/login-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle="El acceso lo crea un líder de equipo o un administrador."
      footer="¿No puedes acceder? Pide ayuda a un líder de equipo."
    >
      <LoginForm />
    </AuthShell>
  );
}
