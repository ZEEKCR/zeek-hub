"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { setOwnBirthday } from "@/server/services/birthdays";
import { updateOwnContact } from "@/server/services/users";
import { removeOwnPhoto, setOwnPhoto } from "@/server/services/photos";

export type PhotoFormState =
  { ok: true; message: string } | { ok: false; message: string } | null;

export async function savePhotoAction(
  _state: PhotoFormState,
  formData: FormData,
): Promise<PhotoFormState> {
  const actor = await requireActor();
  if (formData.get("remove") === "1") {
    const removed = await removeOwnPhoto(actor);
    if (!removed.ok) return { ok: false, message: removed.error.message };
    revalidatePath("/", "layout");
    return { ok: true, message: "Quitamos tu foto." };
  }
  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return { ok: false, message: "Escoge una foto." };
  }
  const result = await setOwnPhoto(
    actor,
    new Uint8Array(await file.arrayBuffer()),
  );
  if (!result.ok) return { ok: false, message: result.error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Listo, ya se ve tu foto." };
}

export type DetailsFormState =
  { ok: true; message: string } | { ok: false; message: string } | null;

/** Email, phone and birthday, saved together from the profile grid. */
export async function saveDetailsAction(
  _state: DetailsFormState,
  formData: FormData,
): Promise<DetailsFormState> {
  const actor = await requireActor();
  const contact = await updateOwnContact(actor, {
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!contact.ok) return { ok: false, message: contact.error.message };
  const month = String(formData.get("month") ?? "").trim();
  const day = String(formData.get("day") ?? "").trim();
  const birthday = await setOwnBirthday(
    actor,
    month || day ? { month: Number(month), day: Number(day) } : null,
  );
  if (!birthday.ok) return { ok: false, message: birthday.error.message };
  revalidatePath("/perfil");
  revalidatePath("/inicio");
  revalidatePath("/personas");
  revalidatePath("/equipos");
  return { ok: true, message: "Listo, guardamos tus datos." };
}
