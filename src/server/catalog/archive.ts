import type { Activity, Task } from "@/server/domain/types";

export function isArchivedTask(
  task: Pick<Task, "activityIds">,
  activities: Pick<Activity, "id" | "stage">[],
) {
  const finished = new Set(
    activities
      .filter((activity) => activity.stage === "finished")
      .map((activity) => activity.id),
  );
  return task.activityIds.some((id) => finished.has(id));
}
