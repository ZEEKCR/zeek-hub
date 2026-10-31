"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { createSuggestion } from "@/server/services/suggestions";

export type SuggestionFormState =
  { ok: true; message: string } | { ok: false; message: string } | null;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createSuggestionAction(
  _state: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  const actor = await requireActor();
  const result = await createSuggestion(actor, {
    kind: field(formData, "kind"),
    title: field(formData, "title"),
    description: field(formData, "description"),
    contactName: field(formData, "contactName"),
    contactInfo: field(formData, "contactInfo"),
    country: field(formData, "country"),
  });
  if (!result.ok) return { ok: false, message: result.error.message };
  revalidatePath("/eventos/sugerir");
  revalidatePath("/admin/sugerencias");
  return {
    ok: true,
    message: "¡Gracias! Recibimos tu sugerencia y un Head la va a revisar.",
  };
}
