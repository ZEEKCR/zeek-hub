import { eq } from "drizzle-orm";
import { ensureMigrated, getDb } from "@/server/db/client";
import { syncState } from "@/server/db/schema";

export async function GET() {
  try {
    await ensureMigrated();
    const rows = await getDb()
      .select()
      .from(syncState)
      .where(eq(syncState.source, "all"))
      .limit(1);
    const last = rows[0]?.lastRunAt ?? null;
    const ageSeconds = last
      ? Math.round((Date.now() - last.getTime()) / 1000)
      : null;
    return Response.json({ ok: true, db: "up", syncAgeSeconds: ageSeconds });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
