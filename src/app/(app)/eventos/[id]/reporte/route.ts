import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { STATUS_LABEL } from "@/server/catalog/status";
import { viewOf } from "@/server/catalog/view";
import { foldName } from "@/server/domain/assignee";
import { toCsv } from "@/server/attendance/rules";
import { buildEventReport } from "@/server/services/attendance";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireActor();
  const { id } = await params;
  const catalog = await loadCatalog();
  const activity = catalog.activities.find(
    (item) => item.id === id && item.published,
  );
  if (!activity) return new Response("No encontrado", { status: 404 });
  const view = viewOf(catalog);
  const pending = catalog.tasks
    .filter((task) => task.activityIds.includes(id) && task.status !== "done")
    .map((task) => ({
      title: task.title,
      status: STATUS_LABEL[task.status],
      assignees: task.assigneeIds
        .map((assigneeId) => view.personName(assigneeId))
        .filter(Boolean),
    }));
  const report = await buildEventReport(actor, id, pending);
  if (!report.ok) return new Response("Sin permiso", { status: 403 });
  const slug =
    foldName(activity.title).replaceAll(" ", "-").slice(0, 40) || "evento";
  return new Response(toCsv(report.data), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-${slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
