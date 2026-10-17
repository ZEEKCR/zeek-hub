import { requireActor } from "@/server/auth/request";
import { isArchivedTask } from "@/server/catalog/archive";
import { loadCatalog } from "@/server/catalog/load";
import { STATUS_LABEL } from "@/server/catalog/status";
import { viewOf } from "@/server/catalog/view";
import { activityKindLabel } from "@/server/domain/projects";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { searchAll } from "@/server/search/rules";
import { listTeamAccounts } from "@/server/services/users";

export async function GET(request: Request) {
  const actor = await requireActor();
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.length > 80) return Response.json({ results: [] });
  const catalog = await loadCatalog();
  const view = viewOf(catalog);
  const teamName = new Map(INITIAL_TEAMS.map((team) => [team.id, team.name]));
  const accounts = await listTeamAccounts();
  const results = searchAll(query, {
    tasks: catalog.tasks
      .filter((task) => !isArchivedTask(task, catalog.activities))
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: STATUS_LABEL[task.status],
      })),
    activities: view.publishedActivities().map((activity) => ({
      id: activity.id,
      title: activity.title,
      kind: activityKindLabel(activity.kind),
    })),
    resources: view.visibleResources(actor).map((resource) => ({
      id: resource.id,
      title: resource.title,
      url: resource.url,
      tags: resource.tags,
    })),
    people: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      team: teamName.get(account.teamId ?? "") ?? "",
      jobTitle: account.jobTitle ?? "",
    })),
  });
  return Response.json(
    { results },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
