import type { TaskStatus, ActivityStage } from "@/server/domain/types";

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

export const STAGE_LABEL: Record<ActivityStage, string> = {
  idea: "Idea",
  development: "En desarrollo",
  execution: "En ejecución",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export const STAGE_ORDER: ActivityStage[] = [
  "idea",
  "development",
  "execution",
  "finished",
];
