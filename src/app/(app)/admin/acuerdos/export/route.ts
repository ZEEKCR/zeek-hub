import { toCsv } from "@/server/attendance/rules";
import { requireActor } from "@/server/auth/request";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { listAgreementStatus } from "@/server/services/agreements";
import { formatCostaRica } from "@/lib/dates";

/** CSV of who has uploaded the agreement, for Heads. */
export async function GET() {
  const actor = await requireActor();
  if (actor.role !== "admin")
    return new Response("Sin permiso", { status: 403 });
  const teamName = new Map(INITIAL_TEAMS.map((team) => [team.id, team.name]));
  const rows = await listAgreementStatus(actor);
  const csv = toCsv([
    ["Nombre", "Equipo", "Estado", "Fecha de subida"],
    ...rows.map((row) => [
      row.name,
      teamName.get(row.teamId ?? "") ?? "",
      row.agreement ? "Subido" : "Pendiente",
      row.agreement
        ? formatCostaRica(row.agreement.uploadedAt, "yyyy-MM-dd")
        : "",
    ]),
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="acuerdos-voluntariado.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
