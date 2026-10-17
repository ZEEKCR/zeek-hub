import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireActor } from "@/server/auth/request";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  if (actor.mustChangePassword) redirect("/cambiar-contrasena");
  if (!actor.privacyAcceptedAt) redirect("/privacidad");
  return (
    <AppShell
      name={actor.fullName || actor.displayName}
      teamId={actor.teamId ?? null}
      admin={actor.role === "admin"}
    >
      {children}
    </AppShell>
  );
}
