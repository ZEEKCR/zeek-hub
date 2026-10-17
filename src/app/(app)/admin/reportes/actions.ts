"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { setReportStatus } from "@/server/services/reports";

export async function setReportStatusAction(formData: FormData) {
  const actor = await requireActor();
  const status = formData.get("status") === "resolved" ? "resolved" : "open";
  await setReportStatus(actor, String(formData.get("id") ?? ""), status);
  revalidatePath("/admin/reportes");
}
