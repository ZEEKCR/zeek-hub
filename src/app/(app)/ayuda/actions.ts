"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { createReport } from "@/server/services/reports";

export type ReportFormState =
  { ok: true; message: string } | { ok: false; message: string } | null;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createReportAction(
  _state: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const actor = await requireActor();
  const result = await createReport(actor, {
    kind: field(formData, "kind"),
    subject: field(formData, "subject"),
    message: field(formData, "message"),
    screen: field(formData, "screen"),
    userAgent: field(formData, "userAgent"),
  });
  if (!result.ok) return { ok: false, message: result.error.message };
  revalidatePath("/admin/reportes");
  return {
    ok: true,
    message: "Gracias, recibimos tu reporte. Un Head lo va a revisar.",
  };
}
