"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/request";
import { setOwnBirthday } from "@/server/services/birthdays";

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
