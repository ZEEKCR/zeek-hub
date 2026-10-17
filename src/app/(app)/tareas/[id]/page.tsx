import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { TaskEditor } from "@/components/tasks/task-editor";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { canEditTask, dayKey, viewOf } from "@/server/catalog/view";
import { listAssignableNames } from "@/server/services/users";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const { id } = await params;
  const task = catalog.tasks.find((item) => item.id === id);
  if (!task) notFound();
  const activities = catalog.activities
    .filter(
      (activity) =>
        activity.published || task.activityIds.includes(activity.id),
    )
    .map((activity) => ({ id: activity.id, title: activity.title }))
    .sort((left, right) => left.title.localeCompare(right.title, "es"));

  const view = viewOf(catalog);
  const assignees = task.assigneeIds
    .filter((assigneeId) => assigneeId.startsWith("enc:"))
    .map((assigneeId) => view.personName(assigneeId));
  const people = [
    ...new Set([...(await listAssignableNames()), ...assignees]),
  ].sort((left, right) => left.localeCompare(right, "es"));

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader kicker="Tarea" title={task.title} />
      <TaskEditor
        locked={!canEditTask(actor, task)}
        activities={activities}
        people={people}
        task={{
          id: task.id,
          title: task.title,
          status: task.status,
          ...(task.priority ? { priority: task.priority } : {}),
          ...(task.dueDate?.start ? { due: dayKey(task.dueDate.start) } : {}),
          ...(task.area ? { area: task.area } : {}),
          ...(task.activityIds[0] ? { activityId: task.activityIds[0] } : {}),
          ...(task.notes ? { notes: task.notes } : {}),
          assignees,
        }}
      />
    </div>
  );
}
