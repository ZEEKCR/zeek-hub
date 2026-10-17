import { CreateUserForm } from "@/app/(app)/admin/usuarios/create-user-form";
import { ChangeRoleForm } from "@/app/(app)/admin/usuarios/change-role-form";
import { DeleteUserForm } from "@/app/(app)/admin/usuarios/delete-user-form";
import { RenameUserForm } from "@/app/(app)/admin/usuarios/rename-user-form";
import { requireActor } from "@/server/auth/request";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { roleLabel } from "@/server/domain/roles";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";

export default async function AdminUsersPage() {
  const actor = await requireActor();
  if (actor.role !== "admin") {
    return <p>No tiene permiso para ver esta pantalla.</p>;
  }
  await ensureMigrated();
  const users = await getDb().select().from(user);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <h1 className="text-4xl font-semibold">Usuarios</h1>
        <ul className="mt-6 grid gap-3">
          {users.map((item) => (
            <li key={item.id} className="bg-surface-1 rounded-[20px] px-4 py-3">
              <p className="font-semibold">{item.name}</p>
              <p className="text-muted text-sm">
                @{item.username} · {roleLabel(item.role)}
                {item.banned ? " · inactivo" : ""}
              </p>
              <RenameUserForm userId={item.id} name={item.name} />
              <ChangeRoleForm
                userId={item.id}
                role={item.role}
                disabled={item.id === actor.userId}
              />
              <DeleteUserForm
                userId={item.id}
                disabled={item.id === actor.userId}
              />
            </li>
          ))}
        </ul>
      </section>
      <CreateUserForm
        teams={INITIAL_TEAMS.map((team) => ({
          id: team.id,
          name: team.name,
        }))}
        allowRole
      />
    </div>
  );
}
