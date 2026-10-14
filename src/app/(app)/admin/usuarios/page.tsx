import { CreateUserForm } from "@/app/(app)/admin/usuarios/create-user-form";
import { requireActor } from "@/server/auth/request";
import { listDirectory } from "@/server/services/users";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";

export default async function AdminUsersPage() {
  const actor = await requireActor();
  if (actor.role !== "admin") {
    return <p>No tiene permiso para ver esta pantalla.</p>;
  }
  await ensureMigrated();
  const users = await getDb().select().from(user);
  const directory = await listDirectory(actor);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <h1 className="text-4xl font-semibold">Usuarios</h1>
        <ul className="mt-6 grid gap-3">
          {users.map((item) => (
            <li key={item.id} className="bg-surface-1 rounded-[20px] px-4 py-3">
              <p className="font-semibold">
                {item.displayUsername || item.name}
              </p>
              <p className="text-muted text-sm">
                @{item.username} · {item.role}
                {item.banned ? " · inactivo" : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <CreateUserForm
        teams={directory.teams.map((team) => ({
          id: team.id,
          name: team.name,
        }))}
        allowRole
      />
    </div>
  );
}
