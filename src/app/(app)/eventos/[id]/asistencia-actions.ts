"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { isProject } from "@/server/domain/projects";
import {
  createShift,
  deleteShift,
  joinShift,
  leaveShift,
  setRsvp,
} from "@/server/services/attendance";

export type AttendanceState =
  { ok: true; message: string } | { ok: false; message: string } | null;

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Attendance only makes sense for a published event, not a project. */
async function findEvent(activityId: string) {
  const catalog = await loadCatalog();
  return catalog.activities.find(
    (item) => item.id === activityId && item.published && !isProject(item),
  );
}

function refresh(activityId: string) {
  revalidatePath(`/eventos/${activityId}`);
}

export async function rsvpAction(formData: FormData) {
  const actor = await requireActor();
  const activityId = text(formData, "activityId");
  if (!(await findEvent(activityId))) return;
  const status = text(formData, "status");
  await setRsvp(actor, activityId, status === "clear" ? null : status);
  refresh(activityId);
}

export async function addShiftAction(
  _state: AttendanceState,
  formData: FormData,
): Promise<AttendanceState> {
  const actor = await requireActor();
  const activityId = text(formData, "activityId");
  if (!(await findEvent(activityId))) {
    return { ok: false, message: "El evento ya no está disponible." };
  }
  const result = await createShift(actor, activityId, {
    title: text(formData, "title"),
    start: text(formData, "start"),
    end: text(formData, "end"),
    capacity: text(formData, "capacity"),
  });
  if (!result.ok) return { ok: false, message: result.error.message };
  refresh(activityId);
  return { ok: true, message: "Turno creado." };
}

export async function shiftAction(
  _state: AttendanceState,
  formData: FormData,
): Promise<AttendanceState> {
  const actor = await requireActor();
  const activityId = text(formData, "activityId");
  const shiftId = text(formData, "shiftId");
  const intent = text(formData, "intent");
  const result =
    intent === "join"
      ? await joinShift(actor, shiftId)
      : intent === "leave"
        ? await leaveShift(actor, shiftId)
        : intent === "delete"
          ? await deleteShift(actor, shiftId)
          : null;
  if (!result) return { ok: false, message: "Acción no válida." };
  if (!result.ok) return { ok: false, message: result.error.message };
  refresh(activityId);
  return { ok: true, message: "" };
}
