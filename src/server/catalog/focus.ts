import { dayKey } from "@/server/catalog/view";
import type { Task } from "@/server/domain/types";

export function assigneeKeys(
  volunteerId: string | null,
  notionUserId?: string | null,
) {
  return [volunteerId, notionUserId].filter((id): id is string => Boolean(id));
}

export function tasksAssignedTo(tasks: Task[], ids: string[]) {
  if (ids.length === 0) return [];
  return tasks.filter((task) =>
    task.assigneeIds.some((id) => ids.includes(id)),
  );
}

export function isTodayOrOverdue(task: Task, today: string) {
  const start = task.dueDate?.start;
  if (!start) return false;
  const day = dayKey(start);
  if (day === today) return true;
  return day < today && task.status !== "done";
}
