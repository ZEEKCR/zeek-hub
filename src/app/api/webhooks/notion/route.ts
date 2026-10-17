import { verifyNotionSignature } from "@/server/sync/signature";
import { LIMITS, consumeLimit } from "@/server/ratelimit/limiter";
import { getEnv } from "@/env";
import { syncFromNotion } from "@/server/sync/run";

export async function POST(request: Request) {
  const allowed = await consumeLimit("webhook:notion", LIMITS.webhook);
  if (!allowed)
    return Response.json(
      { message: "Demasiadas solicitudes" },
      { status: 429 },
    );
  const secret = getEnv().NOTION_WEBHOOK_SECRET;
  if (!secret)
    return Response.json(
      { message: "Webhook no configurado" },
      { status: 503 },
    );
  const body = await request.text();
  const valid = verifyNotionSignature(
    body,
    request.headers.get("x-notion-signature"),
    secret,
  );
  if (!valid)
    return Response.json({ message: "Firma inválida" }, { status: 401 });
  const payload = JSON.parse(body) as { entity?: { id?: string } };
  const pageId = payload.entity?.id;
  if (pageId) await syncFromNotion(pageId);
  return Response.json({ ok: true });
}
