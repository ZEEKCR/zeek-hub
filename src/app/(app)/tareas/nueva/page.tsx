import { TaskEditor } from "@/components/tasks/task-editor";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";

export default async function NewTaskPage() {
  const actor = await requireActor();
  const catalog = await loadCatalog();
  const canCreate = actor.role === "admin" || actor.role === "head";
  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        Nueva tarea
      </h1>
      <TaskEditor
        locked={!canCreate}
        activities={catalog.activities
          .filter((activity) => activity.published)
          .map((activity) => ({ id: activity.id, title: activity.title }))
          .sort((left, right) => left.title.localeCompare(right.title, "es"))}
      />
    </div>
  );
}
