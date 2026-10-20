import { Download, FileCheck2, Search, ShieldOff, Trash2 } from "lucide-react";
import { removeAgreementAction } from "@/app/(app)/admin/acuerdos/actions";
import { AgreementUploader } from "@/components/agreements/agreement-uploader";
import { AdminTabs } from "@/components/layout/admin-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressRing } from "@/components/ui/progress-ring";
import { QueryChips } from "@/components/ui/query-chips";
import { formatCostaRica } from "@/lib/dates";
import { one, searchRecord } from "@/lib/query";
import { teamTone } from "@/lib/team-colors";
import { requireActor } from "@/server/auth/request";
import { foldName } from "@/server/domain/assignee";
import { roleLabel } from "@/server/domain/roles";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { formatSize } from "@/server/agreements/rules";
import { listAgreementStatus } from "@/server/services/agreements";

export default async function AgreementsPage({
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
  const filter = one(raw.estado) ?? "pendientes";
  const state =
    filter === "subidos" || filter === "todos" ? filter : "pendientes";
  const query = foldName(one(raw.q) ?? "");
  const all = await listAgreementStatus(actor);
  const done = all.filter((row) => row.agreement).length;
  const percent = all.length ? Math.round((done / all.length) * 100) : 0;
  const teamName = new Map(INITIAL_TEAMS.map((team) => [team.id, team.name]));
  const rows = all.filter((row) => {
    if (state === "pendientes" && row.agreement) return false;
    if (state === "subidos" && !row.agreement) return false;
    return query ? foldName(row.name).includes(query) : true;
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Acuerdos de voluntariado"
        subtitle="Quién ya firmó y subió su acuerdo, y quién sigue pendiente."
        actions={
          <a href="/admin/acuerdos/export" className="btn btn-secondary">
            <Download size={16} aria-hidden />
            Exportar CSV
          </a>
        }
      />
      <AdminTabs active="acuerdos" />
      <section
        aria-label="Resumen"
        className="panel flex flex-wrap items-center gap-5"
      >
        <ProgressRing value={percent} size={72} />
        <div>
          <p className="text-3xl font-semibold tabular-nums">
            {done} de {all.length}
          </p>
          <p className="text-muted text-sm">
            personas ya subieron su acuerdo firmado
            {all.length - done > 0
              ? ` · faltan ${all.length - done}`
              : " · ¡todo completo!"}
          </p>
        </div>
      </section>
      <form action="/admin/acuerdos" className="relative max-w-md">
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
          placeholder="Buscar por nombre"
          className="field pl-10"
        />
        <input type="hidden" name="estado" value={state} />
      </form>
      <QueryChips
        label="Estado"
        pathname="/admin/acuerdos"
        search={search}
        param="estado"
        value={state}
        options={[
          { id: "pendientes", label: "Pendientes", count: all.length - done },
          { id: "subidos", label: "Subidos", count: done },
          { id: "todos", label: "Todos", count: all.length },
        ]}
      />
      <ul className="grid gap-3">
        {rows.map((row) => {
          const tone = teamTone(row.teamId);
          return (
            <li key={row.userId} className="panel-flat grid gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-muted flex flex-wrap items-center gap-x-2 text-sm">
                    <span>{row.jobTitle || roleLabel(row.role as never)}</span>
                    {row.teamId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor: tone?.solid ?? "currentColor",
                          }}
                        />
                        {teamName.get(row.teamId) ?? "Equipo"}
                      </span>
                    ) : null}
                  </p>
                </div>
                {row.agreement ? (
                  <span className="badge badge-accent">
                    <FileCheck2 size={13} aria-hidden />
                    Firmado y subido
                  </span>
                ) : (
                  <span className="badge badge-warning">Pendiente</span>
                )}
              </div>
              {row.agreement ? (
                <p className="text-muted text-xs">
                  {row.agreement.filename} · {formatSize(row.agreement.size)} ·
                  subido el{" "}
                  {formatCostaRica(row.agreement.uploadedAt, "d MMM yyyy")}
                  {row.agreement.uploadedBy &&
                  row.agreement.uploadedBy !== row.userId
                    ? " por un Head"
                    : ""}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                {row.agreement ? (
                  <a
                    href={`/api/agreement/${row.userId}`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download size={15} aria-hidden />
                    Descargar
                  </a>
                ) : null}
                <AgreementUploader
                  userId={row.userId}
                  label={
                    row.agreement ? "Reemplazar PDF" : "Subir por esta persona"
                  }
                  compact
                />
                {row.agreement ? (
                  <form action={removeAgreementAction}>
                    <input type="hidden" name="userId" value={row.userId} />
                    <button
                      type="submit"
                      className="btn btn-danger btn-sm"
                      aria-label={`Quitar el acuerdo de ${row.name}`}
                    >
                      <Trash2 size={14} aria-hidden />
                      Quitar
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 size={20} aria-hidden />}
          title={
            state === "pendientes" && !query
              ? "¡Nadie tiene el acuerdo pendiente!"
              : "No hay personas con ese filtro."
          }
        />
      ) : null}
    </div>
  );
}
