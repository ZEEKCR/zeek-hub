import { requireActor } from "@/server/auth/request";
import { readAgreement } from "@/server/services/agreements";

/** Download. Only the person and the Heads can open an agreement. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const actor = await requireActor();
  const { userId } = await params;
  const file = await readAgreement(actor, userId);
  if (!file) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
