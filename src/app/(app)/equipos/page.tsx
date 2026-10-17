import { Users } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { EmptyState } from "@/components/ui/empty-state";
import { NotchedCard } from "@/components/ui/notched-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { listTeamAccounts } from "@/server/services/users";

export default async function TeamsPage() {
  await requireActor();
  const catalog = await loadCatalog();
  const accounts = await listTeamAccounts();
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Equipos"
        subtitle="Quién forma cada departamento y cuánto trabajo tiene abierto."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.teams.map((team) => {
          const members = accounts.filter(
            (account) => account.teamId === team.id,
          );
          const open = catalog.tasks.filter(
            (task) => task.teamIds.includes(team.id) && task.status !== "done",
          ).length;
          return (
            <NotchedCard
              key={team.id}
              actionLabel={`Abrir ${team.name}`}
              href={`/equipos/${team.id}`}
            >
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <div className="mt-4 min-h-8">
                {members.length > 0 ? (
                  <AvatarStack
                    names={members.map(
                      (member) => member.displayUsername || member.name,
                    )}
                  />
                ) : (
                  <p className="text-sm opacity-60">Sin cuentas todavía</p>
                )}
              </div>
              <p className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="badge">
                  {members.length} {members.length === 1 ? "cuenta" : "cuentas"}
                </span>
                <span className="badge badge-violet">
                  {open} {open === 1 ? "tarea abierta" : "tareas abiertas"}
                </span>
              </p>
            </NotchedCard>
          );
        })}
      </div>
      {catalog.teams.length === 0 ? (
        <EmptyState
          icon={<Users size={20} aria-hidden />}
          title="No hay equipos para mostrar."
        />
      ) : null}
    </div>
  );
}
