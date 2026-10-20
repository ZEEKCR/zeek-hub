"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { removeAgreement } from "@/server/services/agreements";

export async function removeAgreementAction(formData: FormData) {
  const actor = await requireActor();
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;
  await removeAgreement(actor, userId);
  revalidatePath("/admin/acuerdos");
}
