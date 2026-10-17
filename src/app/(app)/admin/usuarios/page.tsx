import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronDown } from "lucide-react";
import { AdminTabs } from "@/components/layout/admin-tabs";
import { countOpenReports } from "@/server/services/reports";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { CreateUserForm } from "@/app/(app)/admin/usuarios/create-user-form";
import { ChangeRoleForm } from "@/app/(app)/admin/usuarios/change-role-form";
import { DeleteUserForm } from "@/app/(app)/admin/usuarios/delete-user-form";
import { ResetPasswordForm } from "@/app/(app)/admin/usuarios/reset-password-form";
import { ProfileForm } from "@/app/(app)/admin/usuarios/profile-form";
import { RenameUserForm } from "@/app/(app)/admin/usuarios/rename-user-form";
import { requireActor } from "@/server/auth/request";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { isPlaceholderEmail } from "@/server/auth/credentials";
import { roleLabel } from "@/server/domain/roles";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";

export default async function AdminUsersPage() {
  const actor = await requireActor();
  if (actor.role !== "admin") {
    return (
      <EmptyState
        icon={<ShieldOff size={20} aria-hidden />}
        title="No tiene permiso para ver esta pantalla."
      />
    );
  }
  await ensureMigrated();
  const users = await getDb().select().from(user);
  const teams = INITIAL_TEAMS.map((team) => ({ id: team.id, name: team.name }));
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Usuarios"
        subtitle={`${users.length} ${users.length === 1 ? "cuenta" : "cuentas"}. Edita nombre, rol y perfil, o crea una cuenta nueva.`}
      />
      <AdminTabs
        active="usuarios"
        openReports={await countOpenReports(actor)}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ul className="grid gap-3">
          {users.map((item) => {
            const department = teams.find((team) => team.id === item.teamId);
            return (
              <li key={item.id} className="panel-flat p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={item.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="text-muted truncate text-sm">
                      @{item.username}
                      {item.jobTitle ? ` · ${item.jobTitle}` : ""}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`badge ${item.role === "admin" ? "badge-accent" : item.role === "head" ? "badge-violet" : ""}`}
                      >
                        {roleLabel(item.role)}
                      </span>
                      {department ? (
                        <span className="badge">{department.name}</span>
                      ) : null}
                      {item.banned ? (
                        <span className="badge badge-danger">Inactivo</span>
                      ) : null}
                    </p>
                  </div>
                </div>
                <details className="group border-line mt-3 border-t pt-3">
                  <summary className="btn btn-secondary btn-sm w-fit cursor-pointer list-none">
                    Editar usuario
                    <ChevronDown
                      size={15}
                      className="transition group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="mt-4 grid gap-5">
                    <section className="grid gap-1">
                      <h3 className="eyebrow">Nombre completo</h3>
                      <RenameUserForm userId={item.id} name={item.name} />
                    </section>
                    <section className="grid gap-1">
                      <h3 className="eyebrow">Rol de permisos</h3>
                      <ChangeRoleForm
                        userId={item.id}
                        role={item.role}
                        disabled={item.id === actor.userId}
                      />
                    </section>
                    <section className="grid gap-1">
                      <h3 className="eyebrow">Perfil</h3>
                      <ProfileForm
                        userId={item.id}
                        teams={teams}
                        teamId={item.teamId ?? ""}
                        jobTitle={item.jobTitle ?? ""}
                        email={isPlaceholderEmail(item.email) ? "" : item.email}
                        phone={item.phone ?? ""}
                      />
                    </section>
                    <section className="grid gap-1">
                      <h3 className="eyebrow">Contraseña</h3>
                      <ResetPasswordForm
                        userId={item.id}
                        person={{
                          name: item.name,
                          username: item.username ?? "",
                          department: department?.name ?? "ZEEK",
                          ...(item.jobTitle ? { jobTitle: item.jobTitle } : {}),
                        }}
                        disabled={item.id === actor.userId}
                      />
                    </section>
                    <section className="border-line grid gap-1 border-t pt-4">
                      <h3 className="eyebrow text-danger">Zona de peligro</h3>
                      <DeleteUserForm
                        userId={item.id}
                        disabled={item.id === actor.userId}
                      />
                    </section>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
        <div className="xl:sticky xl:top-6">
          <CreateUserForm teams={teams} allowRole />
        </div>
      </div>
    </div>
  );
}
