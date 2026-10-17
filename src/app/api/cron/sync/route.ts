import { createHash, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/env";
import { syncFromNotion } from "@/server/sync/run";

export function authorizationMatches(
  header: string | null,
  secret: string | undefined,
) {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  const left = createHash("sha256").update(token).digest();
  const right = createHash("sha256").update(secret).digest();
  return timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const secret = getEnv().CRON_SECRET;
  if (!authorizationMatches(request.headers.get("authorization"), secret)) {
    return Response.json({ message: "No autorizado" }, { status: 401 });
  }
  const result = await syncFromNotion();
  return Response.json(result);
}
