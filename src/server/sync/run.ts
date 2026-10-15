import { eq } from "drizzle-orm";
import { getEnv } from "@/env";
import { ensureMigrated, getDb } from "@/server/db/client";
import {
  mirrorActivities,
  mirrorResources,
  mirrorTasks,
  mirrorTeams,
  mirrorVolunteers,
  syncState,
} from "@/server/db/schema";
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
  const [volunteers, teams, tasks, activities, resources] = await Promise.all([
    env.NOTION_DS_VOLUNTEERS ? repos.volunteers.list() : [],
    env.NOTION_DS_TEAMS ? repos.teams.list() : [],
    env.NOTION_DS_TASKS ? repos.tasks.list() : [],
    env.NOTION_DS_ACTIVITIES ? repos.activities.list() : [],
    env.NOTION_DS_RESOURCES ? repos.resources.list() : [],
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
  for (const task of tasks) {
    await upsertMirror(
      mirrorTasks,
      task.id,
      task,
      new Date(task.updatedAt),
      started,
    );
  }
  for (const activity of activities) {
    await upsertMirror(
      mirrorActivities,
      activity.id,
      activity,
      activity.start ? new Date(activity.start) : started,
      started,
    );
  }
  for (const resource of resources) {
    await upsertMirror(
      mirrorResources,
      resource.id,
      resource,
      started,
      started,
    );
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
    after: {
      volunteers: volunteers.length,
      teams: teams.length,
      tasks: tasks.length,
      activities: activities.length,
      resources: resources.length,
    },
  });
  return {
    mode: "live" as const,
    volunteers: volunteers.length,
    teams: teams.length,
    tasks: tasks.length,
    activities: activities.length,
    resources: resources.length,
  };
}

async function upsertMirror(
  table:
    | typeof mirrorVolunteers
    | typeof mirrorTeams
    | typeof mirrorTasks
    | typeof mirrorActivities
    | typeof mirrorResources,
  notionId: string,
  data: unknown,
  edited: Date,
  started: Date,
) {
  await getDb()
    .insert(table)
    .values({ notionId, data, notionLastEdited: edited, syncedAt: started })
    .onConflictDoUpdate({
      target: table.notionId,
      set: { data, notionLastEdited: edited, syncedAt: started },
    });
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
