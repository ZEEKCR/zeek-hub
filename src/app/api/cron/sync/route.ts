import { getEnv } from "@/env";
import { syncFromNotion } from "@/server/sync/run";

export async function GET(request: Request) {
  const secret = getEnv().CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ message: "No autorizado" }, { status: 401 });
  }
  const result = await syncFromNotion();
  return Response.json(result);
}
