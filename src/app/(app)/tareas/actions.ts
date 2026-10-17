"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEnv } from "@/env";
import { requireActor } from "@/server/auth/request";
import { authorize } from "@/server/auth/policy";
import { TASK_AREAS } from "@/server/catalog/options";
import { invalidateCatalog, loadCatalog } from "@/server/catalog/load";
import { canEditTask, dayKey } from "@/server/catalog/view";
import type { Priority, TaskStatus } from "@/server/domain/types";
import { teamIdForArea } from "@/server/repositories/notion/mappers";
import { updateTaskStatus } from "@/server/repositories/notion/repos";
import {
  createTaskPage,
  trashNotionPage,
  updateTaskPage,
  type TaskWrite,
} from "@/server/repositories/notion/write";

export type FormState = { ok: false; message: string } | null;

const statuses = new Set<TaskStatus>([
  "not_started",
  "blocked",
  "in_progress",
  "done",
]);
const priorities = new Set<Priority>(["P0", "P1", "P2", "P3"]);
const areas = new Set<string>(TASK_AREAS);

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function refresh() {
  invalidateCatalog();
  revalidatePath("/tareas");
  revalidatePath("/inicio");
  revalidatePath("/calendario");
  revalidatePath("/eventos");
}

function isTask(value: TaskWrite | FormState): value is TaskWrite {
  return value !== null && !("ok" in value);
}

function readTask(formData: FormData): TaskWrite | FormState {
  const title = clean(formData.get("title"));
  const status = clean(formData.get("status")) as TaskStatus;
  const priority = clean(formData.get("priority"));
  const due = clean(formData.get("due"));
  const area = clean(formData.get("area"));
  const activityId = clean(formData.get("activityId"));
  const notes = clean(formData.get("notes"));
  if (!title || title.length > 200) {
    return { ok: false, message: "Escribe un título de hasta 200 caracteres." };
  }
  if (!statuses.has(status)) {
    return { ok: false, message: "El estado no es válido." };
  }
  if (priority && !priorities.has(priority as Priority)) {
    return { ok: false, message: "La prioridad no es válida." };
  }
  if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    return { ok: false, message: "La fecha no es válida." };
  }
  if (area && !areas.has(area)) {
    return { ok: false, message: "El área no es válida." };
  }
  if (notes.length > 2000) {
    return { ok: false, message: "Las notas son demasiado largas." };
  }
  return {
    title,
    status,
    ...(priority ? { priority: priority as Priority } : {}),
    ...(due ? { due } : {}),
    ...(area ? { area } : {}),
    ...(activityId ? { activityId } : {}),
    ...(notes ? { notes } : {}),
  };
}

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

export async function saveTaskAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireActor();
  if (getEnv().NOTION_MODE !== "live") {
    return { ok: false, message: "Notion no está conectado." };
  }
  const parsed = readTask(formData);
  if (!isTask(parsed)) return parsed;
  const catalog = await loadCatalog();
  if (
    parsed.activityId &&
    !catalog.activities.some((item) => item.id === parsed.activityId)
  ) {
    return { ok: false, message: "El evento no existe." };
  }
  const id = clean(formData.get("id"));
  const teamId = teamIdForArea(parsed.area);
  if (!id) {
    const allowed = authorize(actor, "tasks.create", {
      kind: "task",
      assigneeIds: [],
      teamIds: teamId ? [teamId] : [],
    });
    if (!allowed) return { ok: false, message: "No se puede crear la tarea." };
    let created = "";
    try {
      created = await createTaskPage(parsed);
    } catch {
      return { ok: false, message: "No se pudo guardar la tarea en Notion." };
    }
    refresh();
    redirect(`/tareas/${created}`);
  }
  const task = catalog.tasks.find((item) => item.id === id);
  if (!task) return { ok: false, message: "No se encontró la tarea." };
  if (!canEditTask(actor, task)) {
    return { ok: false, message: "No se puede editar esta tarea." };
  }
  const preserveDue = Boolean(
    task.dueDate?.timed &&
    task.dueDate.start &&
    parsed.due &&
    dayKey(task.dueDate.start) === parsed.due,
  );
  try {
    await updateTaskPage(id, parsed, { preserveDue });
  } catch {
    return { ok: false, message: "No se pudo guardar la tarea en Notion." };
  }
  refresh();
  redirect(`/tareas/${id}`);
}

export async function trashTaskAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireActor();
  if (formData.get("confirm") !== "yes") {
    return { ok: false, message: "Confirma el envío a la papelera de Notion." };
  }
  if (getEnv().NOTION_MODE !== "live") {
    return { ok: false, message: "Notion no está conectado." };
  }
  const id = clean(formData.get("id"));
  const catalog = await loadCatalog();
  const task = catalog.tasks.find((item) => item.id === id);
  if (!task) return { ok: false, message: "No se encontró la tarea." };
  if (!canEditTask(actor, task)) {
    return { ok: false, message: "No se puede borrar esta tarea." };
  }
  try {
    await trashNotionPage(id);
  } catch {
    return { ok: false, message: "No se pudo enviar la tarea a la papelera." };
  }
  refresh();
  redirect("/tareas");
}
