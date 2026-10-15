import { notFound } from "next/navigation";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { canSeeContact } from "@/server/catalog/view";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const { id } = await params;
  const team = catalog.teams.find((item) => item.id === id);
  if (!team) notFound();
  const members = catalog.people.filter((person) => person.teamId === team.id);
  const showContact = canSeeContact(actor, [team.id]);
  const tasks = catalog.tasks.filter((task) => task.teamIds.includes(team.id));

  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        {team.name}
      </h1>
      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Miembros</h2>
        {members.map((member) => (
          <article key={member.id} className="bg-surface-1 rounded-[20px] p-4">
            <h3 className="font-semibold">
              {member.name}
              {team.headIds.includes(member.id) ? (
                <span className="bg-violet text-on-violet ml-2 rounded-full px-2 py-1 text-xs">
                  Head
                </span>
              ) : null}
            </h3>
            <p className="text-muted mt-1 text-sm">
              {showContact
                ? "Correo y teléfono visibles para este equipo"
                : "El contacto se ve dentro del equipo"}
            </p>
          </article>
        ))}
      </section>
      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Tareas del equipo</h2>
        {tasks.map((task) => (
          <p key={task.id} className="bg-surface-1 rounded-[20px] px-4 py-3">
            {task.title}
          </p>
        ))}
      </section>
    </div>
  );
}
