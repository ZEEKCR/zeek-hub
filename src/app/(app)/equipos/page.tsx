import { AvatarStack } from "@/components/ui/avatar-stack";
import { NotchedCard } from "@/components/ui/notched-card";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { viewOf } from "@/server/catalog/view";

export default async function TeamsPage() {
  await requireActor();
  const catalog = await loadCatalog();
  const view = viewOf(catalog);
  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        Equipos
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        {catalog.teams.map((team) => {
          const members = catalog.people.filter(
            (person) => person.teamId === team.id,
          );
          const head = members[0];
          const open = catalog.tasks.filter(
            (task) => task.teamIds.includes(team.id) && task.status !== "done",
          ).length;
          return (
            <NotchedCard
              key={team.id}
              actionLabel={`Abrir ${team.name}`}
              href={`/equipos/${team.id}`}
            >
              <h2 className="text-2xl font-semibold">{team.name}</h2>
              {head && team.headIds.includes(head.id) ? (
                <p className="mt-3 text-sm">
                  {head.name}
                  <span className="bg-violet text-on-violet ml-2 rounded-full px-2 py-1 text-xs">
                    Head
                  </span>
                </p>
              ) : null}
              <div className="mt-4">
                <AvatarStack
                  names={members.map((member) => view.personName(member.id))}
                />
              </div>
              <p className="mt-4 text-sm">{open} tareas abiertas</p>
            </NotchedCard>
          );
        })}
      </div>
      {catalog.teams.length === 0 ? (
        <p className="text-muted">No hay equipos para mostrar.</p>
      ) : null}
    </div>
  );
}
