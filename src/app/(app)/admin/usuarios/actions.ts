"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import {
  createUserAs,
  changeAccountRole,
  deactivateAccount,
  deleteAccount,
  renameAccount,
  resetUserPassword,
  unlockAccount,
} from "@/server/services/users";
import type { Role } from "@/server/domain/types";
import { err, type Result } from "@/server/domain/result";

export type UserActionState = Result<{
  tempPassword?: string;
  message: string;
}> | null;

function roleFromForm(value: FormDataEntryValue | null, fallback: Role): Role {
  if (value === "volunteer" || value === "head" || value === "admin")
    return value;
  return fallback;
}

export async function createUserAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requireActor();
  const secondary = String(formData.get("secondary") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const result = await createUserAs(actor, {
    username: String(formData.get("username") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: roleFromForm(formData.get("role"), "volunteer"),
    primaryTeamId: String(formData.get("teamId") ?? ""),
    ...(secondary.length > 0 ? { secondaryTeamIds: secondary } : {}),
    ...(String(formData.get("email") ?? "").trim()
      ? { email: String(formData.get("email")) }
      : {}),
    ...(String(formData.get("phone") ?? "").trim()
      ? { phone: String(formData.get("phone")) }
      : {}),
  });
  if (!result.ok) return result;
  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    data: {
      tempPassword: result.data.tempPassword,
      message:
        "Usuario creado. La contraseña temporal se muestra una sola vez.",
    },
  };
}

export async function renameUserAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requireActor();
  const result = await renameAccount(
    actor,
    String(formData.get("userId") ?? ""),
    String(formData.get("name") ?? ""),
  );
  if (!result.ok) return result;
  revalidatePath("/admin/usuarios");
  revalidatePath("/inicio");
  return { ok: true, data: { message: "Nombre guardado." } };
}

export async function changeRoleAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requireActor();
  const result = await changeAccountRole(
    actor,
    String(formData.get("userId") ?? ""),
    String(formData.get("role") ?? ""),
  );
  if (!result.ok) return result;
  revalidatePath("/admin/usuarios");
  return { ok: true, data: { message: "Rol guardado." } };
}

export async function deleteUserAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await requireActor();
  if (formData.get("confirm") !== "yes") {
    return err("validation", "Marca la casilla para confirmar.");
  }
  const result = await deleteAccount(
    actor,
    String(formData.get("userId") ?? ""),
  );
  if (!result.ok) return result;
  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    data: { message: `Usuario ${result.data.username} eliminado.` },
  };
}

export async function resetPasswordAction(formData: FormData) {
  const actor = await requireActor();
  const result = await resetUserPassword(
    actor,
    String(formData.get("userId") ?? ""),
  );
  if (!result.ok) return err(result.error.code, result.error.message);
  revalidatePath("/admin/usuarios");
  return result;
}

export async function unlockAction(formData: FormData) {
  const actor = await requireActor();
  return unlockAccount(actor, String(formData.get("userId") ?? ""));
}

export async function deactivateAction(formData: FormData) {
  const actor = await requireActor();
  return deactivateAccount(actor, String(formData.get("userId") ?? ""));
}
