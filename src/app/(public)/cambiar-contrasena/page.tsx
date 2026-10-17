import { ChangePasswordForm } from "@/app/(public)/cambiar-contrasena/change-password-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ChangePasswordPage() {
  return (
    <AuthShell
      title="Cambiar contraseña"
      subtitle="Se requiere cambiar la contraseña."
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
