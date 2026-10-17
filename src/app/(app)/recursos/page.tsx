import { ArrowUpRight, FileText } from "lucide-react";
import { QueryChips } from "@/components/ui/query-chips";
import { one, searchRecord } from "@/lib/query";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { viewOf } from "@/server/catalog/view";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const view = viewOf(catalog);
  const raw = await searchParams;
  const search = searchRecord(raw);
  const type = one(raw.tipo) ?? "all";
  const team = one(raw.equipo) ?? "all";
  const tag = one(raw.etiqueta) ?? "all";
  const query = (one(raw.q) ?? "").trim().toLowerCase();
  const visible = view.visibleResources(actor);
  const tags = [...new Set(visible.flatMap((resource) => resource.tags))];
  const resources = visible.filter((resource) => {
    if (type !== "all" && resource.type !== type) return false;
    if (team !== "all" && resource.teamId !== team) return false;
    if (tag !== "all" && !resource.tags.includes(tag)) return false;
    if (
      query &&
      !`${resource.title} ${resource.tags.join(" ")}`
        .toLowerCase()
        .includes(query)
    )
      return false;
    return true;
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        Recursos
      </h1>
      <form className="flex gap-2" action="/recursos">
        {type !== "all" ? (
          <input type="hidden" name="tipo" value={type} />
        ) : null}
        {team !== "all" ? (
          <input type="hidden" name="equipo" value={team} />
        ) : null}
        {tag !== "all" ? (
          <input type="hidden" name="etiqueta" value={tag} />
        ) : null}
        <input
          name="q"
          defaultValue={one(raw.q) ?? ""}
          placeholder="Buscar"
          aria-label="Buscar recursos"
          className="bg-surface-2 h-12 flex-1 rounded-full px-4"
        />
        <button
          type="submit"
          className="bg-accent h-12 rounded-full px-5 font-semibold text-[#161616]"
        >
          Buscar
        </button>
      </form>
      <QueryChips
        label="Tipo"
        pathname="/recursos"
        search={search}
        param="tipo"
        value={type}
        options={[
          { id: "all", label: "Todos" },
          { id: "Guía", label: "Guía" },
          { id: "Plantilla", label: "Plantilla" },
          { id: "Checklist", label: "Checklist" },
          { id: "Nota", label: "Nota" },
        ]}
      />
      <QueryChips
        label="Equipo"
        pathname="/recursos"
        search={search}
        param="equipo"
        value={team}
        options={[
          { id: "all", label: "Todos los equipos" },
          ...catalog.teams.map((item) => ({ id: item.id, label: item.name })),
        ]}
      />
      <QueryChips
        label="Etiqueta"
        pathname="/recursos"
        search={search}
        param="etiqueta"
        value={tag}
        options={[
          { id: "all", label: "Todas" },
          ...tags.map((item) => ({ id: item, label: item })),
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource) => (
          <article
            key={resource.id}
            className="bg-surface-1 flex items-start gap-4 rounded-[28px] p-5"
          >
            <span className="bg-violet text-on-violet grid size-11 shrink-0 place-items-center rounded-full">
              <FileText size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">{resource.title}</h2>
              <p className="text-muted mt-1 text-sm">
                {view.teamName(resource.teamId)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border-line rounded-full border px-3 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${resource.title}`}
              className="bg-surface-2 grid size-10 place-items-center rounded-full"
            >
              <ArrowUpRight size={18} />
            </a>
          </article>
        ))}
      </div>
      {resources.length === 0 ? (
        <p className="text-muted">No hay recursos con ese filtro.</p>
      ) : null}
    </div>
  );
}
