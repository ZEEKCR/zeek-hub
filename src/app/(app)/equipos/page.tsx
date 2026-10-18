import { Users } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { EmptyState } from "@/components/ui/empty-state";
import { NotchedCard } from "@/components/ui/notched-card";
import { PageHeader } from "@/components/ui/page-header";
import { teamToneOrFallback } from "@/lib/team-colors";
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
        actions={
          <Link href="/personas" className="btn btn-secondary">
            <Users size={17} aria-hidden />
            Directorio de personas
          </Link>
        }
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
              accent={teamToneOrFallback(team.id).solid}
            >
              <h2 className="flex items-center gap-2.5 text-xl font-semibold">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${teamToneOrFallback(team.id).solid}, ${teamToneOrFallback(team.id).soft})`,
                  }}
                />
                {team.name}
              </h2>
              <div className="mt-4 min-h-8">
                {members.length > 0 ? (
                  <AvatarStack
                    names={members.map((member) => member.name)}
                    teams={members.map(() => team.id)}
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
