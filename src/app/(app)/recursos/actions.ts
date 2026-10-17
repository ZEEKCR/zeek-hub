"use server";

import { revalidatePath } from "next/cache";
import { getEnv } from "@/env";
import { authorize } from "@/server/auth/policy";
import { requireActor } from "@/server/auth/request";
import { invalidateCatalog } from "@/server/catalog/load";
import { writeAudit } from "@/server/audit/log";
import {
  createResourcePage,
  describeResourceError,
} from "@/server/repositories/notion/resources";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { validateResourceInput } from "@/server/resources/rules";

export type ResourceFormState =
  { ok: true; message: string } | { ok: false; message: string } | null;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createResourceAction(
  _state: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const actor = await requireActor();
  if (!authorize(actor, "resources.create")) {
    return { ok: false, message: "No tiene permiso para crear recursos." };
  }
  if (getEnv().NOTION_MODE !== "live") {
    return { ok: false, message: "Notion no está conectado." };
  }
  const parsed = validateResourceInput(
    {
      title: field(formData, "title"),
      url: field(formData, "url"),
      type: field(formData, "type"),
      teamId: field(formData, "teamId"),
      tags: field(formData, "tags"),
      visibility: field(formData, "visibility"),
    },
    INITIAL_TEAMS.map((team) => team.id),
  );
  if (!parsed.ok) return { ok: false, message: parsed.message };
  const team = INITIAL_TEAMS.find((item) => item.id === parsed.data.teamId);
  let pageId = "";
  try {
    pageId = await createResourcePage(parsed.data, team?.name ?? "");
  } catch (error) {
    console.error("resource.create failed", error);
    return { ok: false, message: describeResourceError(error) };
  }
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "resource.create",
    entity: "resource",
    entityId: pageId,
    after: {
      type: parsed.data.type,
      teamId: parsed.data.teamId,
      visibility: parsed.data.visibility,
    },
  });
  invalidateCatalog();
  revalidatePath("/recursos");
  return { ok: true, message: "Recurso guardado." };
}
