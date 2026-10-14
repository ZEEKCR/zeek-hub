"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp } from "@/server/auth/request";
import { loginWithPassword } from "@/server/services/users";
import type { Result } from "@/server/domain/result";

export async function loginAction(
  _state: Result<{ redirected: true }> | null,
  formData: FormData,
) {
  const headerList = await headers();
  const result = await loginWithPassword({
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    ip: clientIp(headerList),
    headers: headerList,
  });
  if (!result.ok) return result;
  if (result.data.mustChangePassword) redirect("/cambiar-contrasena");
  if (result.data.needsConsent) redirect("/privacidad");
  redirect("/inicio");
}
