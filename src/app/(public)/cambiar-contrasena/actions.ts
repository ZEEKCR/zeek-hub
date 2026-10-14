"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/request";
import { changeOwnPassword } from "@/server/services/users";
import { err, type Result } from "@/server/domain/result";

export async function changePasswordAction(
  _state: Result<{ changed: true }> | null,
  formData: FormData,
) {
  const actor = await requireActor();
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next !== confirm)
    return err("validation", "Las contraseñas no coinciden.");
  const headerList = await headers();
  const result = await changeOwnPassword({
    actor,
    currentPassword: String(formData.get("current") ?? ""),
    nextPassword: next,
    headers: headerList,
  });
  if (!result.ok) return result;
  if (!actor.privacyAcceptedAt) redirect("/privacidad");
  redirect("/inicio");
}
