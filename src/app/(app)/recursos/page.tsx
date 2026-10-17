import {
  ArrowUpRight,
  ChevronDown,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { ResourceForm } from "@/app/(app)/recursos/resource-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { QueryChips } from "@/components/ui/query-chips";
import { one, searchRecord } from "@/lib/query";
import { authorize } from "@/server/auth/policy";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { viewOf } from "@/server/catalog/view";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";

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
      <PageHeader
        title="Recursos"
        subtitle={`${resources.length} ${resources.length === 1 ? "recurso" : "recursos"} para el equipo: guías, plantillas y listas de verificación.`}
      />
      {authorize(actor, "resources.create") ? (
        <details className="panel group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-lg font-semibold">
              <Plus size={18} aria-hidden />
              Nuevo recurso
            </span>
            <ChevronDown
              size={18}
              className="text-muted transition group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="mt-4">
            <ResourceForm
              teams={INITIAL_TEAMS.map((item) => ({
                id: item.id,
                name: item.name,
              }))}
            />
          </div>
        </details>
      ) : null}
      <div className="panel-flat grid gap-4 p-4">
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
          <div className="relative flex-1">
            <Search
              size={16}
              className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              aria-hidden
            />
            <input
              name="q"
              defaultValue={one(raw.q) ?? ""}
              placeholder="Buscar por título o etiqueta"
              aria-label="Buscar recursos"
              className="field rounded-full pl-10"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <p className="eyebrow">Tipo</p>
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
          </div>
          <div className="grid gap-1.5">
            <p className="eyebrow">Equipo</p>
            <QueryChips
              label="Equipo"
              pathname="/recursos"
              search={search}
              param="equipo"
              value={team}
              options={[
                { id: "all", label: "Todos los equipos" },
                ...catalog.teams.map((item) => ({
                  id: item.id,
                  label: item.name,
                })),
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <p className="eyebrow">Etiqueta</p>
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
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <article
            key={resource.id}
            className="panel hover:border-surface-3 flex items-start gap-4 motion-safe:transition"
          >
            <span className="bg-violet text-on-violet grid size-11 shrink-0 place-items-center rounded-2xl">
              <FileText size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg leading-snug font-semibold">
                {resource.title}
              </h2>
              <p className="text-muted mt-1 text-sm">
                {view.teamName(resource.teamId)}
                {resource.type ? ` · ${resource.type}` : ""}
              </p>
              {resource.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {resource.tags.map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${resource.title}`}
              className="bg-surface-2 hover:bg-surface-3 grid size-10 shrink-0 place-items-center rounded-full transition-colors"
            >
              <ArrowUpRight size={18} />
            </a>
          </article>
        ))}
      </div>
      {resources.length === 0 ? (
        <EmptyState
          icon={<FileText size={20} aria-hidden />}
          title="No hay recursos con ese filtro."
          hint="Prueba con otra búsqueda o quita algún filtro."
        />
      ) : null}
    </div>
  );
}
