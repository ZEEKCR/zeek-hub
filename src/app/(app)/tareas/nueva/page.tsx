import { one } from "@/lib/query";
import { PageHeader } from "@/components/ui/page-header";
import { TaskEditor } from "@/components/tasks/task-editor";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { listAssignableNames } from "@/server/services/users";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const preset = one((await searchParams).evento);
  const canCreate = actor.role === "admin" || actor.role === "head";
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="Nueva tarea" />
      <TaskEditor
        locked={!canCreate}
        {...(preset &&
        catalog.activities.some((item) => item.id === preset && item.published)
          ? { defaultActivityId: preset }
          : {})}
        people={await listAssignableNames()}
        activities={catalog.activities
          .filter((activity) => activity.published)
          .map((activity) => ({ id: activity.id, title: activity.title }))
          .sort((left, right) => left.title.localeCompare(right.title, "es"))}
      />
    </div>
  );
}
