"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/request";
import { getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";

/** Where the welcome can send someone next; anything else goes to Inicio. */
const DESTINATIONS = new Set(["/inicio", "/perfil", "/tareas?mias=1"]);

export async function finishWelcomeAction(formData: FormData) {
  const actor = await requireActor();
  await getDb()
    .update(user)
    .set({ welcomeSeenAt: new Date() })
    .where(eq(user.id, actor.userId));
  const to = formData.get("to");
  redirect(typeof to === "string" && DESTINATIONS.has(to) ? to : "/inicio");
}
