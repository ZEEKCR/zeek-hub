import { CreateUserForm } from "@/app/(app)/admin/usuarios/create-user-form";
import { requireActor } from "@/server/auth/request";
import { listDirectory } from "@/server/services/users";

export default async function NewTeamUserPage() {
  const actor = await requireActor();
  if (actor.role !== "admin") {
    return <p>No tiene permiso para ver esta pantalla.</p>;
  }
  const directory = await listDirectory(actor);
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-4xl font-semibold">Nuevo voluntario</h1>
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
