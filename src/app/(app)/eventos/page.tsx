import { CalendarDays, Lightbulb, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroGradientCard } from "@/components/ui/hero-gradient-card";
import { NotchedCard } from "@/components/ui/notched-card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { QueryChips } from "@/components/ui/query-chips";
import { QuerySelect } from "@/components/ui/query-select";
import { CountryFlag } from "@/components/ui/country-flag";
import { formatWhen } from "@/lib/dates";
import { one, searchRecord } from "@/lib/query";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { dayKey, todayKey, viewOf } from "@/server/catalog/view";
import { STAGE_LABEL } from "@/server/catalog/status";
import {
  activityScope,
  countryFilterOptions,
  DEFAULT_COUNTRY,
  matchesCountryFilter,
  resolveCountryFilter,
} from "@/server/domain/countries";
import {
  activityKindLabel,
  compareProjects,
  isOpenProject,
  isProject,
} from "@/server/domain/projects";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const view = viewOf(catalog);
  const raw = await searchParams;
  const search = searchRecord(raw);
  const scope = one(raw.alcance) ?? "proximos";
  const today = todayKey();
  const myCountry = actor.country ?? DEFAULT_COUNTRY;
  const country = resolveCountryFilter(one(raw.pais), actor.role);
  const published = view
    .publishedActivities()
    .filter((activity) =>
      matchesCountryFilter(activityScope(activity), country, myCountry),
    );
  const projectsScope = scope === "proyectos";
  const events = projectsScope
    ? published.filter(isOpenProject).sort(compareProjects)
    : published
        .filter((activity) => {
          if (isProject(activity)) {
            return scope === "pasados" && activity.stage === "finished";
          }
          if (!activity.start) return scope !== "pasados";
          const day = dayKey(activity.start);
          if (scope === "pasados") return day < today;
          return day >= today;
        })
        .sort((left, right) =>
          (left.start ?? "").localeCompare(right.start ?? ""),
        );
  const next = published
    .filter(
      (activity) =>
        !isProject(activity) &&
        activity.start &&
        dayKey(activity.start) >= today,
    )
    .sort((left, right) =>
      (left.start ?? "").localeCompare(right.start ?? ""),
    )[0];

  return (
    <div className="grid gap-6">
      <PageHeader
        title={projectsScope ? "Proyectos" : "Eventos"}
        subtitle={
          projectsScope
            ? "Trabajo en curso que no depende de una fecha, con su avance y su equipo."
            : scope === "pasados"
              ? "Eventos y proyectos que ya terminaron."
              : "Lo que viene, con su avance y su equipo."
        }
        actions={
          <>
            <Link
              href="/eventos/sugerir"
              className={`btn ${actor.role === "admin" ? "btn-secondary" : "btn-primary"}`}
            >
              <Lightbulb size={18} aria-hidden />
              Sugerir evento
            </Link>
            {actor.role === "admin" ? (
              <Link href="/eventos/nuevo" className="btn btn-primary">
                <Plus size={18} aria-hidden />
                Nueva actividad
              </Link>
            ) : null}
          </>
        }
      />
      <QueryChips
        label="Alcance"
        pathname="/eventos"
        search={search}
        param="alcance"
        value={scope}
        options={[
          { id: "proximos", label: "Próximos" },
          { id: "proyectos", label: "Proyectos" },
          { id: "pasados", label: "Pasados" },
        ]}
      />
      <div className="max-w-xs">
        <QuerySelect
          label="País"
          pathname="/eventos"
          search={search}
          param="pais"
          value={country}
          options={countryFilterOptions(myCountry)}
        />
      </div>
      {next && scope === "proximos" ? (
        <Link href={`/eventos/${next.id}`} className="block">
          <HeroGradientCard kicker="Próximo evento" value={next.title}>
            <p className="text-sm text-white/80">
              {next.start
                ? formatWhen(
                    next.start,
                    next.timed,
                    "EEEE d MMM, HH:mm",
                    "EEEE d MMM",
                  )
                : "Sin fecha"}
              {next.place ? ` · ${next.place}` : ""}
            </p>
            <div className="mt-3">
              <ProgressBar value={view.taskProgress(next.id)} />
            </div>
          </HeroGradientCard>
        </Link>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((activity) => (
          <NotchedCard
            key={activity.id}
            actionLabel={`Abrir ${activity.title}`}
            href={`/eventos/${activity.id}`}
          >
            <p className="flex flex-wrap items-center gap-2">
              <span
                className={`badge ${
                  activity.stage === "execution"
                    ? "badge-accent"
                    : activity.stage === "finished"
                      ? ""
                      : "badge-violet"
                }`}
              >
                {STAGE_LABEL[activity.stage]}
              </span>
              <CountryFlag scope={activityScope(activity)} size={14} />
              {activity.kind ? (
                <span className="text-xs font-medium opacity-70">
                  {activityKindLabel(activity.kind)}
                  {activity.format ? ` · ${activity.format}` : ""}
                </span>
              ) : null}
            </p>
            <h2 className="mt-3 text-xl leading-snug font-semibold">
              {activity.title}
            </h2>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-80">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} aria-hidden />
                {activity.start
                  ? formatWhen(
                      activity.start,
                      activity.timed,
                      "d MMM, HH:mm",
                      "d MMM",
                    )
                  : projectsScope
                    ? "Sin fecha meta"
                    : "Sin fecha"}
              </span>
              {activity.place ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} aria-hidden />
                  {activity.place}
                </span>
              ) : null}
            </p>
            {projectsScope ? (
              <div className="mt-4">
                <ProgressBar value={view.taskProgress(activity.id)} />
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <AvatarStack names={view.knownNames(activity.volunteerIds)} />
              <ProgressRing value={view.taskProgress(activity.id)} size={40} />
            </div>
          </NotchedCard>
        ))}
      </div>
      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={20} aria-hidden />}
          title={
            projectsScope
              ? "No hay proyectos activos."
              : "No hay eventos en esta vista."
          }
          hint={
            projectsScope
              ? "Crea una actividad de tipo Proyecto y aparecerá aquí."
              : scope === "pasados"
                ? "Aquí aparecerán los eventos y proyectos que ya terminaron."
                : "Cuando se publique un evento nuevo aparecerá aquí."
          }
        />
      ) : null}
    </div>
  );
}
