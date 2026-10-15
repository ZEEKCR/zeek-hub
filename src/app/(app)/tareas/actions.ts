"use server";

import { revalidatePath } from "next/cache";
import { getEnv } from "@/env";
import { requireActor } from "@/server/auth/request";
import { invalidateCatalog, loadCatalog } from "@/server/catalog/load";
import { canEditTask } from "@/server/catalog/view";
import type { TaskStatus } from "@/server/domain/types";
import { updateTaskStatus } from "@/server/repositories/notion/repos";

const statuses = new Set<TaskStatus>([
  "not_started",
  "blocked",
  "in_progress",
  "done",
]);

export async function moveTaskAction(
  id: string,
  status: TaskStatus,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await requireActor();
  if (!statuses.has(status)) {
    return { ok: false, message: "El estado no es válido." };
  }
  if (getEnv().NOTION_MODE !== "live") {
    return { ok: false, message: "Notion no está conectado." };
  }
  const catalog = await loadCatalog();
  const task = catalog.tasks.find((item) => item.id === id);
  if (!task) {
    return { ok: false, message: "No se encontró la tarea." };
  }
  if (!canEditTask(actor, task)) {
    return { ok: false, message: "No se puede cambiar esta tarea." };
  }
  try {
    await updateTaskStatus(id, status);
  } catch {
    return { ok: false, message: "No se pudo guardar el estado en Notion." };
  }
  invalidateCatalog();
  revalidatePath("/tareas");
  revalidatePath("/inicio");
  revalidatePath("/calendario");
  return { ok: true };
}
