import { Download, FileCheck2, FileWarning } from "lucide-react";
import { AgreementUploader } from "@/components/agreements/agreement-uploader";
import { Panel } from "@/components/ui/panel";
import { formatCostaRica } from "@/lib/dates";
import { formatSize } from "@/server/agreements/rules";
import type { AgreementMeta } from "@/server/services/agreements";

/** The person's own space for the signed volunteer agreement. */
export function AgreementPanel({
  userId,
  agreement,
}: {
  userId: string;
  agreement: AgreementMeta | null;
}) {
  return (
    <Panel
      title="Acuerdo de voluntariado"
      description="Firma el acuerdo y súbelo aquí en formato PDF."
      actions={
        <span
          className={`grid size-10 place-items-center rounded-full ${agreement ? "bg-accent/15 text-accent-text" : "bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] text-[var(--warning-text)]"}`}
        >
          {agreement ? (
            <FileCheck2 size={18} aria-hidden />
          ) : (
            <FileWarning size={18} aria-hidden />
          )}
        </span>
      }
    >
      <div id="acuerdo" className="grid gap-3">
        {agreement ? (
          <div className="bg-surface-2 flex flex-wrap items-center justify-between gap-3 rounded-[16px] px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="badge badge-accent">Firmado y subido</span>
              </p>
              <p className="text-muted mt-1 truncate text-xs">
                {agreement.filename} · {formatSize(agreement.size)} ·{" "}
                {formatCostaRica(agreement.uploadedAt, "d MMM yyyy")}
              </p>
            </div>
            <a
              href={`/api/agreement/${userId}`}
              className="btn btn-secondary btn-sm"
            >
              <Download size={15} aria-hidden />
              Descargar
            </a>
          </div>
        ) : (
          <p className="text-sm leading-6">
            <span className="badge badge-warning mr-2">Pendiente</span>
            Todavía no has subido tu acuerdo firmado. Si no lo tienes, contacta
            a tu Head.
          </p>
        )}
        <AgreementUploader
          label={agreement ? "Reemplazar PDF" : "Subir acuerdo firmado (PDF)"}
          compact={Boolean(agreement)}
        />
        <p className="text-muted text-xs">
          Solo tú y los Head pueden ver este archivo. Máximo 4 MB.
        </p>
      </div>
    </Panel>
  );
}
