import { Lightbulb, ShieldOff } from "lucide-react";
import { setSuggestionStatusAction } from "@/app/(app)/admin/sugerencias/actions";
import { AdminTabs } from "@/components/layout/admin-tabs";
import { ScopeBadge } from "@/components/ui/country-flag";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { QueryChips } from "@/components/ui/query-chips";
import { formatCostaRica } from "@/lib/dates";
import { one, searchRecord } from "@/lib/query";
import { requireActor } from "@/server/auth/request";
import { parseScope } from "@/server/domain/countries";
import {
  parseSuggestionStatus,
  SUGGESTION_STATUSES,
  suggestionKindLabel,
  suggestionStatusLabel,
} from "@/server/suggestions/rules";
import {
  countNewSuggestions,
  listSuggestions,
} from "@/server/services/suggestions";

export default async function SuggestionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  if (actor.role !== "admin") {
    return (
      <EmptyState
        icon={<ShieldOff size={20} aria-hidden />}
        title="No tiene permiso para ver esta pantalla."
      />
    );
  }
  const raw = await searchParams;
  const search = searchRecord(raw);
  const filter = one(raw.estado) ?? "new";
  const status =
    filter === "all" ? "all" : (parseSuggestionStatus(filter) ?? "new");
  const rows = await listSuggestions(actor, status);
  const fresh = await countNewSuggestions(actor);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Sugerencias"
        subtitle="Ideas de eventos y contactos que propone la gente desde Eventos."
      />
      <AdminTabs active="sugerencias" />
      <QueryChips
        label="Estado"
        pathname="/admin/sugerencias"
        search={search}
        param="estado"
        value={status}
        options={[
          { id: "new", label: "Nuevas", count: fresh },
          ...SUGGESTION_STATUSES.filter((item) => item.id !== "new").map(
            (item) => ({ id: item.id, label: item.label }),
          ),
          { id: "all", label: "Todas" },
        ]}
      />
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.id} className="panel-flat grid gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-violet">
                    {suggestionKindLabel(row.kind)}
                  </span>
                  <ScopeBadge scope={parseScope(row.country) ?? "global"} />
                  {row.status !== "new" ? (
                    <span
                      className={`badge ${row.status === "accepted" ? "badge-accent" : ""}`}
                    >
                      {suggestionStatusLabel(row.status)}
                    </span>
                  ) : null}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{row.title}</h2>
                <p className="text-muted text-sm">
                  {row.suggesterName} ·{" "}
                  {formatCostaRica(row.createdAt, "d MMM yyyy, HH:mm")}
                </p>
              </div>
              <form
                action={setSuggestionStatusAction}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="id" value={row.id} />
                {SUGGESTION_STATUSES.filter(
                  (item) => item.id !== row.status,
                ).map((item) => (
                  <button
                    key={item.id}
                    type="submit"
                    name="status"
                    value={item.id}
                    className="btn btn-secondary btn-sm"
                  >
                    {item.id === "new" ? "Reabrir" : item.label}
                  </button>
                ))}
              </form>
            </div>
            {row.contactName ? (
              <p className="text-sm">
                <span className="text-muted">Contacto: </span>
                <strong>{row.contactName}</strong>
                {row.contactInfo ? ` · ${row.contactInfo}` : ""}
              </p>
            ) : null}
            <p className="bg-surface-2 rounded-[14px] px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
              {row.description}
            </p>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={20} aria-hidden />}
          title="No hay sugerencias en esta vista."
          hint="Cuando alguien sugiera un evento desde Eventos, aparecerá aquí."
        />
      ) : null}
    </div>
  );
}
