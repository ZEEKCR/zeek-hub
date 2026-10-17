import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
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
      <Link
        href="/equipos"
        className="text-muted hover:text-fg inline-flex w-fit items-center gap-1.5 text-sm font-semibold"
      >
        <ArrowLeft size={16} aria-hidden />
        Equipos
      </Link>
      <PageHeader
        kicker="Equipo"
        title={team.name}
        subtitle={`${members.length} ${members.length === 1 ? "cuenta" : "cuentas"} · ${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"}`}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Miembros">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {members.map((member) => {
              const email = showContact ? publicEmail(member.email) : undefined;
              const name = member.displayUsername || member.name;
              return (
                <article
                  key={member.id}
                  className="bg-surface-2 flex items-start gap-3 rounded-[16px] p-3.5"
                >
                  <Avatar name={name} />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{name}</h3>
                    <p className="text-muted mt-0.5 text-sm">
                      @{member.username} · {roleLabel(member.role)}
                    </p>
                    {email ? (
                      <p className="text-muted truncate text-sm">{email}</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {members.length === 0 ? (
            <EmptyState
              icon={<Users size={20} aria-hidden />}
              title="No hay cuentas en este equipo."
            />
          ) : null}
        </Panel>
        <Panel title="Tareas del equipo">
          <div className="grid gap-2">
            {tasks.map((task) => (
              <p
                key={task.id}
                className="bg-surface-2 rounded-[14px] px-3.5 py-2.5 text-sm font-medium"
              >
                {task.title}
              </p>
            ))}
          </div>
          {tasks.length === 0 ? (
            <p className="text-muted text-sm">Sin tareas por ahora.</p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
