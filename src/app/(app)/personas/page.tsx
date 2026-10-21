import { Mail, Phone, Search, Users } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { QueryChips } from "@/components/ui/query-chips";
import { one, searchRecord } from "@/lib/query";
import { teamTone } from "@/lib/team-colors";
import { publicEmail } from "@/server/auth/credentials";
import { requireActor } from "@/server/auth/request";
import { canSeeContact } from "@/server/catalog/view";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  parseCountry,
} from "@/server/domain/countries";
import { foldName } from "@/server/domain/assignee";
import { roleLabel } from "@/server/domain/roles";
import { photoUrl } from "@/server/photos/rules";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { photoVersions } from "@/server/services/photos";
import { listTeamAccounts } from "@/server/services/users";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const raw = await searchParams;
  const search = searchRecord(raw);
  const team = one(raw.equipo) ?? "all";
  const country = one(raw.pais) ?? "all";
  const query = foldName(one(raw.q) ?? "");
  const [accounts, versions] = await Promise.all([
    listTeamAccounts(),
    photoVersions(),
  ]);
  const teamName = new Map(INITIAL_TEAMS.map((item) => [item.id, item.name]));
  const people = accounts.filter((account) => {
    if (team !== "all" && account.teamId !== team) return false;
    if (country !== "all" && parseCountry(account.country) !== country)
      return false;
    if (!query) return true;
    return foldName(
      `${account.name} ${account.jobTitle ?? ""} ${teamName.get(account.teamId ?? "") ?? ""}`,
    ).includes(query);
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Personas"
        subtitle={`${people.length} ${people.length === 1 ? "persona" : "personas"} en ZEEK. El correo y el teléfono solo los ve el propio equipo y los Head.`}
      />
      <form action="/personas" className="relative max-w-md">
        <label className="sr-only" htmlFor="q">
          Buscar persona
        </label>
        <Search
          size={16}
          aria-hidden
          className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
        />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={one(raw.q) ?? ""}
          placeholder="Buscar por nombre, rol o equipo"
          className="field pl-10"
        />
        {team !== "all" ? (
          <input type="hidden" name="equipo" value={team} />
        ) : null}
      </form>
      <QueryChips
        label="País"
        pathname="/personas"
        search={search}
        param="pais"
        value={country}
        options={[
          { id: "all", label: "Todos" },
          ...COUNTRIES.map((item) => ({ id: item.id, label: item.name })),
        ]}
      />
      <QueryChips
        label="Equipo"
        pathname="/personas"
        search={search}
        param="equipo"
        value={team}
        options={[
          { id: "all", label: "Todos" },
          ...INITIAL_TEAMS.map((item) => ({ id: item.id, label: item.name })),
        ]}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {people.map((person) => {
          const showContact = canSeeContact(actor, [person.teamId ?? ""]);
          const email = showContact ? publicEmail(person.email) : undefined;
          const phone = showContact ? person.phone : undefined;
          const tone = teamTone(person.teamId);
          return (
            <article key={person.id} className="panel-flat grid gap-3 p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={person.name}
                  size="lg"
                  team={person.teamId}
                  photo={photoUrl(person.id, versions)}
                />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{person.name}</h2>
                  <p className="text-muted truncate text-sm">
                    {person.jobTitle || roleLabel(person.role)}
                  </p>
                </div>
              </div>
              <p className="flex flex-wrap gap-1.5">
                <span className="badge inline-flex items-center gap-1.5">
                  <CountryFlag
                    scope={parseCountry(person.country) ?? DEFAULT_COUNTRY}
                    size={14}
                  />
                </span>
                {person.teamId ? (
                  <Link
                    href={`/equipos/${person.teamId}`}
                    className="badge"
                    style={tone ? { borderColor: tone.solid } : undefined}
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: tone?.solid ?? "currentColor" }}
                    />
                    {teamName.get(person.teamId) ?? "Equipo"}
                  </Link>
                ) : null}
                {person.role !== "volunteer" ? (
                  <span className="badge badge-violet">
                    {roleLabel(person.role)}
                  </span>
                ) : null}
              </p>
              {email || phone ? (
                <ul className="text-muted grid gap-1 text-sm">
                  {email ? (
                    <li className="flex items-center gap-2">
                      <Mail size={14} aria-hidden />
                      <a
                        href={`mailto:${email}`}
                        className="hover:text-fg truncate"
                      >
                        {email}
                      </a>
                    </li>
                  ) : null}
                  {phone ? (
                    <li className="flex items-center gap-2">
                      <Phone size={14} aria-hidden />
                      <a href={`tel:${phone}`} className="hover:text-fg">
                        {phone}
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>
      {people.length === 0 ? (
        <EmptyState
          icon={<Users size={20} aria-hidden />}
          title="No encontramos a nadie con ese filtro."
        />
      ) : null}
    </div>
  );
}
