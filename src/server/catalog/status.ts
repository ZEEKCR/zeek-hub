import type { TaskStatus } from "@/server/domain/types";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Por hacer",
  in_progress: "En progreso",
  blocked: "Bloqueada",
  done: "Lista",
};

export const STATUS_ORDER: TaskStatus[] = [
  "not_started",
  "in_progress",
  "blocked",
  "done",
];
