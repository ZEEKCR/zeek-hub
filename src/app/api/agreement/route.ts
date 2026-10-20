import { requireActor } from "@/server/auth/request";
import { saveAgreement } from "@/server/services/agreements";

/** Upload of the signed PDF. A Head may send `userId` to upload for another person. */
export async function POST(request: Request) {
  const actor = await requireActor();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { ok: false, message: "No pudimos leer el archivo." },
      { status: 400 },
    );
  }
  const file = form.get("file");
  const target = form.get("userId");
  if (!(file instanceof File)) {
    return Response.json(
      { ok: false, message: "Escoge el archivo PDF del acuerdo firmado." },
      { status: 400 },
    );
  }
  const targetUserId =
    typeof target === "string" && target ? target : actor.userId;
  const result = await saveAgreement(
    actor,
    targetUserId,
    file.name,
    new Uint8Array(await file.arrayBuffer()),
  );
  if (!result.ok) {
    const status =
      result.error.code === "forbidden"
        ? 403
        : result.error.code === "rate_limited"
          ? 429
          : result.error.code === "not_found"
            ? 404
            : 400;
    return Response.json(
      { ok: false, message: result.error.message },
      { status },
    );
  }
  return Response.json({ ok: true });
}
