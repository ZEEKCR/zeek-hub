"use server";

import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/request";
import { acceptPrivacy } from "@/server/services/users";

export async function acceptPrivacyAction() {
  const actor = await requireActor();
  await acceptPrivacy(actor);
  redirect("/inicio");
}
