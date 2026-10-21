import { foldName } from "@/server/domain/assignee";
import { NOTION_SCOPE_OPTIONS, type Scope } from "@/server/domain/countries";
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
  /** Encargado option names; undefined leaves the column untouched. */
  assignees?: string[];
};

export type ActivityWrite = {
  title: string;
  stage: ActivityStage;
  type: string;
  date?: string;
  notes?: string;
  /** País option; undefined leaves the column untouched. */
  country?: Scope;
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
  if (input.assignees) {
    properties[names.encargado] = {
      multi_select: input.assignees.map((name) => ({ name })),
    };
  }
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
  if (input.country) {
    const option = NOTION_SCOPE_OPTIONS.find(
      (item) => item.scope === input.country,
    );
    if (option) properties[names.country] = { select: { name: option.name } };
  }
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

type SelectOption = { id?: string; name: string; color?: string };

/**
 * Adds a name to the Encargado options of Tasks so it shows in the dropdown
 * before anyone is assigned. Existing options are sent back unchanged.
 */
export async function ensureAssigneeOption(name: string) {
  const label = name.trim();
  if (!label) return;
  const { client, call } = createNotionClient();
  const dataSourceIdValue = dataSourceId("tasks");
  const propertyName = notionSchema.tasks.properties.encargado;
  const source = (await call(() =>
    client.dataSources.retrieve({ data_source_id: dataSourceIdValue }),
  )) as unknown as {
    properties?: Record<
      string,
      {
        type?: string;
        select?: { options?: SelectOption[] };
        multi_select?: { options?: SelectOption[] };
      }
    >;
  };
  const property = source.properties?.[propertyName];
  const kind = property?.type;
  if (!property || (kind !== "multi_select" && kind !== "select")) return;
  const existing = property[kind]?.options ?? [];
  if (existing.some((option) => foldName(option.name) === foldName(label)))
    return;
  const options = [
    ...existing.map((option) => ({
      ...(option.id ? { id: option.id } : {}),
      name: option.name,
      ...(option.color ? { color: option.color } : {}),
    })),
    { name: label },
  ];
  await call(() =>
    client.dataSources.update({
      data_source_id: dataSourceIdValue,
      properties: { [propertyName]: { [kind]: { options } } } as never,
    }),
  );
}

/**
 * Makes sure Activities has a País select with Global and the four countries,
 * creating the column or adding missing options. Existing options are kept.
 */
export async function ensureCountryProperty() {
  const { client, call } = createNotionClient();
  const dataSourceIdValue = dataSourceId("activities");
  const propertyName = notionSchema.activities.properties.country;
  const source = (await call(() =>
    client.dataSources.retrieve({ data_source_id: dataSourceIdValue }),
  )) as unknown as {
    properties?: Record<
      string,
      { type?: string; select?: { options?: SelectOption[] } }
    >;
  };
  const property = source.properties?.[propertyName];
  if (property && property.type !== "select") {
    throw new Error(`La columna ${propertyName} no es de tipo Selección.`);
  }
  const existing = property?.select?.options ?? [];
  const missing = NOTION_SCOPE_OPTIONS.filter(
    (item) =>
      !existing.some((option) => foldName(option.name) === foldName(item.name)),
  );
  if (property && missing.length === 0) return;
  const options = [
    ...existing.map((option) => ({
      ...(option.id ? { id: option.id } : {}),
      name: option.name,
      ...(option.color ? { color: option.color } : {}),
    })),
    ...missing.map((item) => ({ name: item.name })),
  ];
  await call(() =>
    client.dataSources.update({
      data_source_id: dataSourceIdValue,
      properties: { [propertyName]: { select: { options } } } as never,
    }),
  );
}
