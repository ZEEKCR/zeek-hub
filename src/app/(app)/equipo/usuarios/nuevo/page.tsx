import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateUserForm } from "@/app/(app)/admin/usuarios/create-user-form";
import { requireActor } from "@/server/auth/request";
import { listDirectory } from "@/server/services/users";

export default async function NewTeamUserPage() {
  const actor = await requireActor();
  if (actor.role !== "admin") {
    return (
      <EmptyState
        icon={<ShieldOff size={20} aria-hidden />}
        title="No tiene permiso para ver esta pantalla."
      />
    );
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
