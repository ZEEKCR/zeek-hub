import { Users } from "lucide-react";
import Link from "next/link";
import { CountryFlag } from "@/components/ui/country-flag";
import { QueryChips } from "@/components/ui/query-chips";
import { one, searchRecord } from "@/lib/query";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  parseCountry,
  taskScope,
} from "@/server/domain/countries";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { EmptyState } from "@/components/ui/empty-state";
import { NotchedCard } from "@/components/ui/notched-card";
import { PageHeader } from "@/components/ui/page-header";
import { teamToneOrFallback } from "@/lib/team-colors";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { listTeamAccounts } from "@/server/services/users";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireActor();
  const raw = await searchParams;
  const search = searchRecord(raw);
  const byCountry = one(raw.vista) === "paises";
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
      <QueryChips
        label="Vista"
        pathname="/equipos"
        search={search}
        param="vista"
        value={byCountry ? "paises" : "departamentos"}
        options={[
          { id: "departamentos", label: "Por departamento" },
          { id: "paises", label: "Por país" },
        ]}
      />
      {byCountry ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COUNTRIES.map((country) => {
            const members = accounts.filter(
              (account) =>
                (parseCountry(account.country) ?? DEFAULT_COUNTRY) ===
                country.id,
            );
            const open = catalog.tasks.filter(
              (task) =>
                task.status !== "done" &&
                taskScope(task, catalog.activities) === country.id,
            ).length;
            return (
              <NotchedCard
                key={country.id}
                actionLabel={`Ver personas de ${country.name}`}
                href={`/personas?pais=${country.id}`}
              >
                <h2 className="flex items-center gap-2.5 text-xl font-semibold">
                  <CountryFlag scope={country.id} size={20} />
                  {country.name}
                </h2>
                <div className="mt-4 min-h-8">
                  {members.length > 0 ? (
                    <AvatarStack
                      names={members.map((member) => member.name)}
                      teams={members.map((member) => member.teamId)}
                    />
                  ) : (
                    <p className="text-sm opacity-60">Sin cuentas todavía</p>
                  )}
                </div>
                <p className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="badge">
                    {members.length}{" "}
                    {members.length === 1 ? "cuenta" : "cuentas"}
                  </span>
                  <span className="badge badge-violet">
                    {open} {open === 1 ? "tarea abierta" : "tareas abiertas"}
                  </span>
                </p>
              </NotchedCard>
            );
          })}
        </div>
      ) : null}
      {!byCountry ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalog.teams.map((team) => {
            const members = accounts.filter(
              (account) => account.teamId === team.id,
            );
            const open = catalog.tasks.filter(
              (task) =>
                task.teamIds.includes(team.id) && task.status !== "done",
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
                    {members.length}{" "}
                    {members.length === 1 ? "cuenta" : "cuentas"}
                  </span>
                  <span className="badge badge-violet">
                    {open} {open === 1 ? "tarea abierta" : "tareas abiertas"}
                  </span>
                </p>
              </NotchedCard>
            );
          })}
        </div>
      ) : null}
      {!byCountry && catalog.teams.length === 0 ? (
        <EmptyState
          icon={<Users size={20} aria-hidden />}
          title="No hay equipos para mostrar."
        />
      ) : null}
    </div>
  );
}
