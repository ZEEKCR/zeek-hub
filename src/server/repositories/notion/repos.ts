import { collectPaginatedAPI, isNotionClientError } from "@notionhq/client";
import type {
  ActivityStage,
  TaskStatus,
  Team,
  Volunteer,
} from "@/server/domain/types";
import { createNotionClient } from "@/server/repositories/notion/client";
import {
  mapActivityPage,
  mapResourcePage,
  mapTaskPage,
  mapTeamPage,
  mapVolunteerPage,
  notionStatusName,
  notionStageName,
  volunteerToProperties,
  type NotionPerson,
} from "@/server/repositories/notion/mappers";
import {
  dataSourceId,
  notionSchema,
} from "@/server/repositories/notion/schema";
import type {
  ActivityRepository,
  ResourceRepository,
  TaskRepository,
  TeamRepository,
  VolunteerRepository,
} from "@/server/repositories/interfaces";

type Page = {
  id: string;
  last_edited_time?: string;
  properties: Record<string, { type?: string }>;
};

function notionUnavailable(error: unknown) {
  if (
    error instanceof Error &&
    error.message.startsWith("Missing NOTION_DS_")
  ) {
    return true;
  }
  return isMissingNotionSource(error);
}

export function isMissingNotionSource(error: unknown) {
  return isNotionClientError(error) && error.code === "object_not_found";
}

async function queryAll(dataSourceIdValue: string) {
  const { client, call } = createNotionClient();
  const pages = await call(() =>
    collectPaginatedAPI(client.dataSources.query, {
      data_source_id: dataSourceIdValue,
      page_size: 100,
    }),
  );
  return pages as unknown as Page[];
}

export function notionVolunteers(): VolunteerRepository {
  return {
    async list() {
      try {
        const pages = await queryAll(dataSourceId("volunteers"));
        return pages.flatMap((page) => {
          const mapped = mapVolunteerPage(page);
          return mapped ? [mapped] : [];
        });
      } catch (error) {
        if (notionUnavailable(error)) return [];
        throw error;
      }
    },
    async get(id) {
      const { client, call } = createNotionClient();
      try {
        const page = (await call(() =>
          client.pages.retrieve({ page_id: id }),
        )) as Page;
        return mapVolunteerPage(page);
      } catch (error) {
        if (notionUnavailable(error)) return null;
        throw error;
      }
    },
    async findByUserId(userId) {
      const all = await this.list();
      return all.find((volunteer) => volunteer.userId === userId) ?? null;
    },
    async upsert(volunteer: Volunteer) {
      try {
        const { client, call } = createNotionClient();
        const properties = volunteerToProperties(volunteer);
        if (
          volunteer.id &&
          !volunteer.id.startsWith("team-") &&
          volunteer.id.includes("-") &&
          volunteer.updatedAt
        ) {
          try {
            await call(() =>
              client.pages.update({
                page_id: volunteer.id,
                properties: properties as never,
              }),
            );
            return volunteer;
          } catch {
            // A new volunteer id is local until Notion assigns one.
          }
        }
        const created = await call(() =>
          client.pages.create({
            parent: {
              type: "data_source_id",
              data_source_id: dataSourceId("volunteers"),
            },
            properties: properties as never,
          }),
        );
        return { ...volunteer, id: created.id };
      } catch (error) {
        if (notionUnavailable(error)) return volunteer;
        throw error;
      }
    },
  };
}

export function notionTeams(): TeamRepository {
  return {
    async list() {
      try {
        const pages = await queryAll(dataSourceId("teams"));
        return pages.flatMap((page) => {
          const mapped = mapTeamPage(page);
          return mapped ? [mapped] : [];
        });
      } catch (error) {
        if (notionUnavailable(error)) return [];
        throw error;
      }
    },
    async get(id) {
      const all = await this.list();
      return all.find((team) => team.id === id) ?? null;
    },
    async upsert(team: Team) {
      return team;
    },
  };
}

export async function readTasks() {
  const pages = await queryAll(dataSourceId("tasks"));
  const mapped = pages.flatMap((page) => {
    const item = mapTaskPage(page);
    return item ? [item] : [];
  });
  return {
    tasks: mapped.map((item) => item.task),
    people: mapped.flatMap((item) => item.people),
  };
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const label = notionStatusName(status);
  if (!label) throw new Error("Unknown task status");
  const { client, call } = createNotionClient();
  await call(() =>
    client.pages.update({
      page_id: id,
      properties: {
        [notionSchema.tasks.properties.status]: {
          status: { name: label },
        },
      } as never,
    }),
  );
}

export async function readActivities() {
  const pages = await queryAll(dataSourceId("activities"));
  const mapped = pages.flatMap((page) => {
    const item = mapActivityPage(page);
    return item ? [item] : [];
  });
  return {
    activities: mapped.map((item) => item.activity),
    people: mapped.flatMap((item) => item.people),
  };
}

export async function updateActivityStage(id: string, stage: ActivityStage) {
  const { client, call } = createNotionClient();
  await call(() =>
    client.pages.update({
      page_id: id,
      properties: {
        [notionSchema.activities.properties.status]: {
          select: { name: notionStageName(stage) },
        },
      } as never,
    }),
  );
}

export async function readResources() {
  const pages = await queryAll(dataSourceId("resources"));
  return pages.flatMap((page) => {
    const item = mapResourcePage(page);
    return item ? [item] : [];
  });
}

export function notionTasks(): TaskRepository {
  return {
    async list() {
      const result = await readTasks();
      return result.tasks;
    },
  };
}

export function notionActivities(): ActivityRepository {
  return {
    async list() {
      const result = await readActivities();
      return result.activities;
    },
  };
}

export function notionResources(): ResourceRepository {
  return {
    async list() {
      return readResources();
    },
  };
}

export function mergePeople(groups: NotionPerson[][]) {
  const people = new Map<string, NotionPerson>();
  for (const group of groups) {
    for (const person of group) people.set(person.id, person);
  }
  return [...people.values()];
}
