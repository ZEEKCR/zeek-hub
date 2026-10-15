import type {
  ActivityStage,
  Priority,
  TaskStatus,
} from "@/server/domain/types";
import {
  notionStageName,
  notionStatusName,
} from "@/server/repositories/notion/mappers";
import { createNotionClient } from "@/server/repositories/notion/client";
import {
  notionSchema,
  dataSourceId,
} from "@/server/repositories/notion/schema";

export type TaskWrite = {
  title: string;
  status: TaskStatus;
  priority?: Priority;
  due?: string;
  area?: string;
  activityId?: string;
  notes?: string;
};

export type ActivityWrite = {
  title: string;
  stage: ActivityStage;
  type: string;
  date?: string;
  notes?: string;
};

function titleProperty(content: string) {
  return { title: [{ type: "text", text: { content } }] };
}

function richText(content: string) {
  return content
    ? { rich_text: [{ type: "text", text: { content } }] }
    : { rich_text: [] };
}

export function taskProperties(
  input: TaskWrite,
  options?: { preserveDue?: boolean },
) {
  const names = notionSchema.tasks.properties;
  const status = notionStatusName(input.status);
  const properties: Record<string, unknown> = {
    [names.title]: titleProperty(input.title),
    [names.status]: { status: { name: status } },
    [names.priority]: input.priority
      ? { select: { name: input.priority } }
      : { select: null },
    [names.due]: input.due ? { date: { start: input.due } } : { date: null },
    [names.areaLegacy]: input.area
      ? { select: { name: input.area } }
      : { select: null },
    [names.activity]: {
      relation: input.activityId ? [{ id: input.activityId }] : [],
    },
    [names.notes]: richText(input.notes ?? ""),
  };
  if (options?.preserveDue) delete properties[names.due];
  return properties;
}

export function activityProperties(
  input: ActivityWrite,
  options?: { preserveDate?: boolean },
) {
  const names = notionSchema.activities.properties;
  const properties: Record<string, unknown> = {
    [names.title]: titleProperty(input.title),
    [names.status]: { select: { name: notionStageName(input.stage) } },
    [names.type]: { select: { name: input.type } },
    [names.date]: input.date ? { date: { start: input.date } } : { date: null },
    [names.notes]: richText(input.notes ?? ""),
  };
  if (options?.preserveDate) delete properties[names.date];
  return properties;
}

async function writePage(
  id: string | undefined,
  dataSource: "tasks" | "activities",
  properties: Record<string, unknown>,
) {
  const { client, call } = createNotionClient();
  if (!id) {
    const created = await call(() =>
      client.pages.create({
        parent: {
          type: "data_source_id",
          data_source_id: dataSourceId(dataSource),
        },
        properties: properties as never,
      }),
    );
    return created.id;
  }
  await call(() =>
    client.pages.update({
      page_id: id,
      properties: properties as never,
    }),
  );
  return id;
}

export function createTaskPage(input: TaskWrite) {
  return writePage(undefined, "tasks", taskProperties(input));
}

export function updateTaskPage(
  id: string,
  input: TaskWrite,
  options?: { preserveDue?: boolean },
) {
  return writePage(id, "tasks", taskProperties(input, options));
}

export function createActivityPage(input: ActivityWrite) {
  return writePage(undefined, "activities", activityProperties(input));
}

export function updateActivityPage(
  id: string,
  input: ActivityWrite,
  options?: { preserveDate?: boolean },
) {
  return writePage(id, "activities", activityProperties(input, options));
}

export async function trashNotionPage(id: string) {
  const { client, call } = createNotionClient();
  await call(() =>
    client.pages.update({
      page_id: id,
      in_trash: true,
    }),
  );
}
