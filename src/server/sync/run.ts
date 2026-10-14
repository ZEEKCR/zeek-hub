import { eq } from "drizzle-orm";
import { getEnv } from "@/env";
import { ensureMigrated, getDb } from "@/server/db/client";
import { mirrorTeams, mirrorVolunteers, syncState } from "@/server/db/schema";
import { repositories } from "@/server/container";
import { writeAudit } from "@/server/audit/log";

export async function syncFromNotion(pageId?: string) {
  await ensureMigrated();
  const env = getEnv();
  const started = new Date();
  if (env.NOTION_MODE !== "live") {
    await getDb()
      .insert(syncState)
      .values({
        source: "all",
        lastRunAt: started,
        status: "mock",
        cursor: pageId ?? null,
      })
      .onConflictDoUpdate({
        target: syncState.source,
        set: { lastRunAt: started, status: "mock", cursor: pageId ?? null },
      });
    return { mode: "mock" as const, pageId: pageId ?? null };
  }

  const repos = repositories();
  const [volunteers, teams] = await Promise.all([
    repos.volunteers.list(),
    repos.teams.list(),
  ]);
  const db = getDb();
  for (const volunteer of volunteers) {
    await db
      .insert(mirrorVolunteers)
      .values({
        notionId: volunteer.id,
        data: volunteer,
        notionLastEdited: new Date(volunteer.updatedAt),
        syncedAt: started,
      })
      .onConflictDoUpdate({
        target: mirrorVolunteers.notionId,
        set: {
          data: volunteer,
          notionLastEdited: new Date(volunteer.updatedAt),
          syncedAt: started,
        },
      });
  }
  for (const team of teams) {
    await db
      .insert(mirrorTeams)
      .values({
        notionId: team.id,
        data: team,
        notionLastEdited: new Date(team.updatedAt),
        syncedAt: started,
      })
      .onConflictDoUpdate({
        target: mirrorTeams.notionId,
        set: {
          data: team,
          notionLastEdited: new Date(team.updatedAt),
          syncedAt: started,
        },
      });
  }
  await db
    .insert(syncState)
    .values({
      source: "all",
      lastRunAt: started,
      status: "ok",
      cursor: pageId ?? null,
    })
    .onConflictDoUpdate({
      target: syncState.source,
      set: { lastRunAt: started, status: "ok", cursor: pageId ?? null },
    });
  await writeAudit({
    actorType: "system",
    action: "sync.run",
    entity: "notion",
    ...(pageId ? { entityId: pageId } : {}),
    after: { volunteers: volunteers.length, teams: teams.length },
  });
  return {
    mode: "live" as const,
    volunteers: volunteers.length,
    teams: teams.length,
  };
}

export async function syncAgeSeconds() {
  await ensureMigrated();
  const rows = await getDb()
    .select()
    .from(syncState)
    .where(eq(syncState.source, "all"))
    .limit(1);
  const last = rows[0]?.lastRunAt;
  if (!last) return null;
  return Math.round((Date.now() - last.getTime()) / 1000);
}
