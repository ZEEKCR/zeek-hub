import { Inbox, ShieldOff } from "lucide-react";
import { setReportStatusAction } from "@/app/(app)/admin/reportes/actions";
import { AdminTabs } from "@/components/layout/admin-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { QueryChips } from "@/components/ui/query-chips";
import { formatCostaRica } from "@/lib/dates";
import { one, searchRecord } from "@/lib/query";
import { requireActor } from "@/server/auth/request";
import { kindLabel } from "@/server/reports/rules";
import { countOpenReports, listReports } from "@/server/services/reports";

export default async function ReportsPage({
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
  const filter = one(raw.estado) ?? "open";
  const status =
    filter === "resolved" ? "resolved" : filter === "all" ? "all" : "open";
  const rows = await listReports(actor, status);
  const open = await countOpenReports(actor);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Reportes"
        subtitle="Problemas, dudas y sugerencias que envían las personas desde Ayuda."
      />
      <AdminTabs active="reportes" openReports={open} />
      <QueryChips
        label="Estado"
        pathname="/admin/reportes"
        search={search}
        param="estado"
        value={filter === "resolved" || filter === "all" ? filter : "open"}
        options={[
          { id: "open", label: "Abiertos", count: open },
          { id: "resolved", label: "Resueltos" },
          { id: "all", label: "Todos" },
        ]}
      />
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.id} className="panel-flat grid gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className={`badge ${row.kind === "bug" ? "badge-danger" : row.kind === "ayuda" ? "badge-info" : "badge-violet"}`}
                  >
                    {kindLabel(row.kind)}
                  </span>
                  {row.screen ? (
                    <span className="badge">{row.screen}</span>
                  ) : null}
                  {row.status === "resolved" ? (
                    <span className="badge badge-accent">Resuelto</span>
                  ) : null}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{row.subject}</h2>
                <p className="text-muted text-sm">
                  {row.reporterName} ·{" "}
                  {formatCostaRica(row.createdAt, "d MMM yyyy, HH:mm")}
                </p>
              </div>
              <form action={setReportStatusAction}>
                <input type="hidden" name="id" value={row.id} />
                <input
                  type="hidden"
                  name="status"
                  value={row.status === "open" ? "resolved" : "open"}
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  {row.status === "open" ? "Marcar resuelto" : "Reabrir"}
                </button>
              </form>
            </div>
            <p className="bg-surface-2 rounded-[14px] px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
              {row.message}
            </p>
            {row.userAgent ? (
              <p className="text-muted truncate text-xs">{row.userAgent}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox size={20} aria-hidden />}
          title={
            status === "resolved"
              ? "Todavía no hay reportes resueltos."
              : "No hay reportes por ahora."
          }
          hint="Cuando alguien envíe uno desde Ayuda, aparecerá aquí."
        />
      ) : null}
    </div>
  );
}
