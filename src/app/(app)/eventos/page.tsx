import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { HeroGradientCard } from "@/components/ui/hero-gradient-card";
import { NotchedCard } from "@/components/ui/notched-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { QueryChips } from "@/components/ui/query-chips";
import { formatWhen } from "@/lib/dates";
import { one, searchRecord } from "@/lib/query";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { dayKey, todayKey, viewOf } from "@/server/catalog/view";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireActor();
  const catalog = await loadCatalog();
  const view = viewOf(catalog);
  const raw = await searchParams;
  const search = searchRecord(raw);
  const scope = one(raw.alcance) ?? "proximos";
  const today = todayKey();
  const events = view
    .publishedActivities()
    .filter((activity) => {
      if (!activity.start) return scope !== "pasados";
      const day = dayKey(activity.start);
      if (scope === "pasados") return day < today;
      return day >= today;
    })
    .sort((left, right) => (left.start ?? "").localeCompare(right.start ?? ""));
  const next = view
    .publishedActivities()
    .filter((activity) => activity.start && dayKey(activity.start) >= today)
    .sort((left, right) =>
      (left.start ?? "").localeCompare(right.start ?? ""),
    )[0];

  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        Eventos
      </h1>
      <QueryChips
        label="Alcance"
        pathname="/eventos"
        search={search}
        param="alcance"
        value={scope}
        options={[
          { id: "proximos", label: "Próximos" },
          { id: "pasados", label: "Pasados" },
        ]}
      />
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
            <div className="mt-4">
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
            <p className="text-sm opacity-70">
              {activity.kind}
              {activity.format ? ` · ${activity.format}` : ""}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{activity.title}</h2>
            <p className="mt-3 text-sm">
              {activity.start
                ? formatWhen(
                    activity.start,
                    activity.timed,
                    "d MMM, HH:mm",
                    "d MMM",
                  )
                : "Sin fecha"}
              {activity.place ? ` · ${activity.place}` : ""}
            </p>
            <div className="mt-4">
              <AvatarStack
                names={activity.volunteerIds.map((id) => view.personName(id))}
              />
            </div>
          </NotchedCard>
        ))}
      </div>
      {events.length === 0 ? (
        <p className="text-muted">No hay eventos en esta vista.</p>
      ) : null}
    </div>
  );
}
