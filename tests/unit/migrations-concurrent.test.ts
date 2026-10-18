import { describe, expect, it } from "vitest";
import { ensureMigrated, getDb } from "@/server/db/client";
import { sql } from "drizzle-orm";

describe("migrations", () => {
  it("can run again and in parallel without failing", async () => {
    await ensureMigrated();
    const { applyMigrationsForTest } = await import("@/server/db/client");
    await Promise.all([
      applyMigrationsForTest(),
      applyMigrationsForTest(),
      applyMigrationsForTest(),
    ]);
    const rows = await getDb().execute(
      sql`SELECT count(*)::int AS total FROM information_schema.tables WHERE table_name = 'user_photos'`,
    );
    expect(rows).toBeTruthy();
  });
});
