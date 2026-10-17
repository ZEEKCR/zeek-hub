import { notFound } from "next/navigation";
import { publicEmail } from "@/server/auth/credentials";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { canSeeContact } from "@/server/catalog/view";
import { roleLabel } from "@/server/domain/roles";
import { listTeamAccounts } from "@/server/services/users";

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
  const members = (await listTeamAccounts()).filter(
    (account) => account.teamId === team.id,
  );
  const showContact = canSeeContact(actor, [team.id]);
  const tasks = catalog.tasks.filter((task) => task.teamIds.includes(team.id));

  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        {team.name}
      </h1>
      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Miembros</h2>
        {members.map((member) => {
          const email = showContact ? publicEmail(member.email) : undefined;
          return (
            <article
              key={member.id}
              className="bg-surface-1 rounded-[20px] p-4"
            >
              <h3 className="font-semibold">
                {member.displayUsername || member.name}
              </h3>
              <p className="text-muted mt-1 text-sm">
                @{member.username} · {roleLabel(member.role)}
              </p>
              {email ? <p className="text-muted text-sm">{email}</p> : null}
            </article>
          );
        })}
        {members.length === 0 ? (
          <p className="text-muted">No hay cuentas en este equipo.</p>
        ) : null}
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
