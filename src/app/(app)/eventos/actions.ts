"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEnv } from "@/env";
import { requireActor } from "@/server/auth/request";
import { ACTIVITY_TYPES } from "@/server/catalog/options";
import { invalidateCatalog, loadCatalog } from "@/server/catalog/load";
import { canEditActivity, dayKey } from "@/server/catalog/view";
import type { ActivityStage } from "@/server/domain/types";
import { updateActivityStage } from "@/server/repositories/notion/repos";
import {
  createActivityPage,
  trashNotionPage,
  updateActivityPage,
  type ActivityWrite,
} from "@/server/repositories/notion/write";

const stages = new Set<ActivityStage>([
  "idea",
  "development",
  "execution",
  "finished",
]);
const types = new Set<string>(ACTIVITY_TYPES.map((item) => item.id));

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function refresh() {
  invalidateCatalog();
  revalidatePath("/eventos");
  revalidatePath("/tareas");
  revalidatePath("/inicio");
  revalidatePath("/calendario");
}

export type FormState = { ok: false; message: string } | null;

function isActivity(value: ActivityWrite | FormState): value is ActivityWrite {
  return value !== null && !("ok" in value);
}

function readActivity(formData: FormData): ActivityWrite | FormState {
  const title = clean(formData.get("title"));
  const stage = clean(formData.get("stage")) as ActivityStage;
  const type = clean(formData.get("type"));
  const date = clean(formData.get("date"));
  const notes = clean(formData.get("notes"));
  if (!title || title.length > 200) {
    return { ok: false, message: "Escribe un título de hasta 200 caracteres." };
  }
  if (!stages.has(stage))
    return { ok: false, message: "La etapa no es válida." };
  if (!types.has(type)) return { ok: false, message: "El tipo no es válido." };
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "La fecha no es válida." };
  }
  if (notes.length > 2000) {
    return { ok: false, message: "Las notas son demasiado largas." };
  }
  return {
    title,
    stage,
    type,
    ...(date ? { date } : {}),
    ...(notes ? { notes } : {}),
  };
}

export async function moveEventStageAction(
  id: string,
  stage: ActivityStage,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await requireActor();
  if (!stages.has(stage)) {
    return { ok: false, message: "La etapa no es válida." };
  }
  if (getEnv().NOTION_MODE !== "live") {
    return { ok: false, message: "Notion no está conectado." };
  }
  const catalog = await loadCatalog();
  const activity = catalog.activities.find((item) => item.id === id);
  if (!activity) {
    return { ok: false, message: "No se encontró el evento." };
  }
  if (!canEditActivity(actor, activity)) {
    return { ok: false, message: "No se puede cambiar este evento." };
  }
  try {
    await updateActivityStage(id, stage);
  } catch {
    return { ok: false, message: "No se pudo guardar la etapa en Notion." };
  }
  invalidateCatalog();
  revalidatePath("/eventos");
  revalidatePath(`/eventos/${id}`);
  revalidatePath("/tareas");
  revalidatePath("/inicio");
  revalidatePath("/calendario");
  return { ok: true };
}

export async function saveActivityAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireActor();
  if (getEnv().NOTION_MODE !== "live") {
    return { ok: false, message: "Notion no está conectado." };
  }
  const parsed = readActivity(formData);
  if (!isActivity(parsed)) return parsed;
  const catalog = await loadCatalog();
  const id = clean(formData.get("id"));
  if (!id) {
    if (actor.role !== "admin" && actor.role !== "head") {
      return { ok: false, message: "No se puede crear la actividad." };
    }
    let created = "";
    try {
      created = await createActivityPage(parsed);
    } catch {
      return {
        ok: false,
        message: "No se pudo guardar la actividad en Notion.",
      };
    }
    refresh();
    revalidatePath(`/eventos/${created}`);
    redirect(`/eventos/${created}`);
  }
  const activity = catalog.activities.find((item) => item.id === id);
  if (!activity) return { ok: false, message: "No se encontró la actividad." };
  if (!canEditActivity(actor, activity)) {
    return { ok: false, message: "No se puede editar esta actividad." };
  }
  const preserveDate = Boolean(
    activity.timed &&
    activity.start &&
    parsed.date &&
    dayKey(activity.start) === parsed.date,
  );
  try {
    await updateActivityPage(id, parsed, { preserveDate });
  } catch {
    return { ok: false, message: "No se pudo guardar la actividad en Notion." };
  }
  refresh();
  revalidatePath(`/eventos/${id}`);
  redirect(`/eventos/${id}`);
}

export async function trashActivityAction(
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
  const activity = catalog.activities.find((item) => item.id === id);
  if (!activity) return { ok: false, message: "No se encontró la actividad." };
  if (!canEditActivity(actor, activity)) {
    return { ok: false, message: "No se puede borrar esta actividad." };
  }
  try {
    await trashNotionPage(id);
  } catch {
    return {
      ok: false,
      message: "No se pudo enviar la actividad a la papelera.",
    };
  }
  refresh();
  redirect("/eventos");
}
