import { ChevronRight, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { readyAuth } from "@/server/auth/config";
import { eq } from "drizzle-orm";
import { publicEmail } from "@/server/auth/credentials";
import { requireActor } from "@/server/auth/request";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { roleLabel } from "@/server/domain/roles";
import { getOwnBirthday } from "@/server/services/birthdays";
import { BirthdayForm } from "@/app/(app)/perfil/birthday-form";

export default async function ProfilePage() {
  const actor = await requireActor();
  await ensureMigrated();
  const [account] = await getDb()
    .select()
    .from(user)
    .where(eq(user.id, actor.userId));
  const department = INITIAL_TEAMS.find((team) => team.id === account?.teamId);
  const contactEmail = publicEmail(account?.email);
  const birthday = await getOwnBirthday(actor);
  const displayName = actor.fullName || actor.displayName;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Perfil"
        subtitle="Tus datos en ZEEK Hub y tus preferencias."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center gap-4">
            <Avatar name={displayName} size="lg" team={account?.teamId} />
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
        <div className="grid gap-6">
          <Panel
            title="Preferencias"
            description="Cómo se ve ZEEK Hub y dónde pedir ayuda."
          >
            <div className="grid gap-2.5">
              <ThemeToggle variant="row" />
              <Link
                href="/ayuda"
                className="bg-surface-2 hover:bg-surface-3 flex items-center gap-3 rounded-[16px] px-4 py-3 transition-colors"
              >
                <span className="bg-surface-1 grid size-9 shrink-0 place-items-center rounded-full">
                  <LifeBuoy size={17} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    Ayuda y reportes
                  </span>
                  <span className="text-muted text-xs">
                    Preguntas frecuentes y reportar un problema.
                  </span>
                </span>
                <ChevronRight size={16} className="text-muted" aria-hidden />
              </Link>
            </div>
          </Panel>
          <Panel
            title="Mi cumpleaños"
            description="Para que el equipo te felicite."
          >
            <BirthdayForm current={birthday} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

async function signOut() {
  "use server";
  const auth = await readyAuth();
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
