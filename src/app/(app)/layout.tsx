import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { photoUrl } from "@/server/photos/rules";
import { photoVersions } from "@/server/services/photos";
import { requireActor } from "@/server/auth/request";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  if (actor.mustChangePassword) redirect("/cambiar-contrasena");
  if (!actor.privacyAcceptedAt) redirect("/privacidad");
  if (!actor.welcomeSeenAt) redirect("/bienvenida");
  const versions = await photoVersions();
  return (
    <AppShell
      name={actor.fullName || actor.displayName}
      teamId={actor.teamId ?? null}
      photo={photoUrl(actor.userId, versions)}
      admin={actor.role === "admin"}
    >
      {children}
    </AppShell>
  );
}
