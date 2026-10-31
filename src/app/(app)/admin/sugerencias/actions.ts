"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { setSuggestionStatus } from "@/server/services/suggestions";

export async function setSuggestionStatusAction(formData: FormData) {
  const actor = await requireActor();
  await setSuggestionStatus(
    actor,
    String(formData.get("id") ?? ""),
    String(formData.get("status") ?? ""),
  );
  revalidatePath("/admin/sugerencias");
  revalidatePath("/eventos/sugerir");
}
