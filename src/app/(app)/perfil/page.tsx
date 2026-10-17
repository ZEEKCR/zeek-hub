import { Monitor } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatCostaRica } from "@/lib/dates";
import { sessionDevice } from "@/lib/session-device";
import { readyAuth } from "@/server/auth/config";
import { eq } from "drizzle-orm";
import { publicEmail } from "@/server/auth/credentials";
import { requireActor } from "@/server/auth/request";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { roleLabel } from "@/server/domain/roles";

export default async function ProfilePage() {
  const actor = await requireActor();
  await ensureMigrated();
  const [account] = await getDb()
    .select()
    .from(user)
    .where(eq(user.id, actor.userId));
  const department = INITIAL_TEAMS.find((team) => team.id === account?.teamId);
  const contactEmail = publicEmail(account?.email);
  const auth = await readyAuth();
  const sessions = await auth.api.listSessions({ headers: await headers() });
  const devices = new Map<string, (typeof sessions)[number]>();
  for (const item of sessions) {
    const label = sessionDevice(item.userAgent);
    const current = devices.get(label);
    if (
      !current ||
      new Date(item.expiresAt).getTime() > new Date(current.expiresAt).getTime()
    ) {
      devices.set(label, item);
    }
  }
  const displayName = actor.fullName || actor.displayName;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Perfil"
        subtitle="Tus datos en ZEEK Hub y las sesiones abiertas."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center gap-4">
            <Avatar name={displayName} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold tracking-tight">
                {displayName}
              </h2>
              <p className="text-muted">@{actor.username}</p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                <span className="badge badge-violet">
                  {roleLabel(actor.role)}
                </span>
                {account?.jobTitle ? (
                  <span className="badge">{account.jobTitle}</span>
                ) : null}
              </p>
            </div>
          </div>
          <dl className="border-line mt-5 grid gap-px overflow-hidden rounded-[16px] border sm:grid-cols-2">
            {[
              ["Departamento", department?.name],
              ["Nombre de rol", account?.jobTitle],
              ["Correo", contactEmail],
              ["Teléfono", account?.phone],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface-2 px-4 py-3">
                <dt className="text-muted text-xs font-semibold">{label}</dt>
                <dd className="mt-0.5 truncate text-sm font-medium">
                  {value || "Sin asignar"}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-muted mt-3 text-xs">
            Un Head actualiza estos datos desde Usuarios.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/cambiar-contrasena" className="btn btn-primary">
              Cambiar contraseña
            </Link>
            <form action={signOut}>
              <button type="submit" className="btn btn-secondary">
                Cerrar sesión
              </button>
            </form>
          </div>
        </Panel>
        <Panel
          title="Sesiones activas"
          description="Los dispositivos con tu cuenta abierta."
        >
          <ul className="grid gap-2.5">
            {[...devices.entries()].map(([label, item]) => (
              <li
                key={label}
                className="bg-surface-2 flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm"
              >
                <Monitor
                  size={18}
                  className="text-muted shrink-0"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block font-semibold">{label}</span>
                  <span className="text-muted">
                    Vence {formatCostaRica(item.expiresAt, "d MMM yyyy, HH:mm")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <form action={revokeOthers} className="mt-4">
            <button type="submit" className="btn btn-secondary">
              Cerrar las demás
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

async function revokeOthers() {
  "use server";
  const auth = await readyAuth();
  await auth.api.revokeOtherSessions({ headers: await headers() });
}

async function signOut() {
  "use server";
  const auth = await readyAuth();
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
