"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { setOwnBirthday } from "@/server/services/birthdays";
import { removeOwnPhoto, setOwnPhoto } from "@/server/services/photos";

export type BirthdayFormState =
  { ok: true; message: string } | { ok: false; message: string } | null;

export async function saveBirthdayAction(
  _state: BirthdayFormState,
  formData: FormData,
): Promise<BirthdayFormState> {
  const actor = await requireActor();
  const remove = formData.get("remove") === "1";
  const result = await setOwnBirthday(
    actor,
    remove
      ? null
      : {
          month: Number(formData.get("month")),
          day: Number(formData.get("day")),
        },
  );
  if (!result.ok) return { ok: false, message: result.error.message };
  revalidatePath("/perfil");
  revalidatePath("/inicio");
  return {
    ok: true,
    message: result.data
      ? "Listo, tu cumpleaños quedó guardado."
      : "Quitamos tu cumpleaños.",
  };
}

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
