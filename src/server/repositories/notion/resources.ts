import { foldName } from "@/server/domain/assignee";
import { createNotionClient } from "@/server/repositories/notion/client";
import { notionTeams } from "@/server/repositories/notion/repos";
import {
  dataSourceId,
  notionSchema,
} from "@/server/repositories/notion/schema";
import type { ResourceInput } from "@/server/resources/rules";

type Kind = "relation" | "select" | "multi_select" | "rich_text" | "url" | null;

export type ResourceColumns = {
  type: Kind;
  team: Kind;
  tags: Kind;
  visibility: Kind;
};

/** The Area-style name the hub already reads back for a team. */
const TEAM_AREA: Record<string, string> = {
  "team-growth": "Growth",
  "team-operations": "Ops",
  "team-communications": "Communications",
  "team-technical": "Technical",
  "team-logistics": "Logistics",
};

const VISIBILITY_LABEL = { core: "Núcleo", volunteers: "Voluntarios" } as const;

function text(content: string) {
  return { rich_text: [{ type: "text", text: { content } }] };
}

/**
 * Builds the Notion properties for a new resource. Columns the database does
 * not have are skipped, and a column that exists with another type is written
 * in that type so the page is created either way.
 */
export function resourceProperties(
  input: ResourceInput,
  columns: ResourceColumns,
  team: { name: string; pageId?: string },
) {
  const names = notionSchema.resources.properties;
  const properties: Record<string, unknown> = {
    [names.title]: {
      title: [{ type: "text", text: { content: input.title } }],
    },
    [names.url]: { url: input.url },
  };
  if (columns.type === "select")
    properties[names.type] = { select: { name: input.type } };
  else if (columns.type === "multi_select")
    properties[names.type] = { multi_select: [{ name: input.type }] };
  else if (columns.type === "rich_text")
    properties[names.type] = text(input.type);

  if (columns.team === "relation") {
    if (team.pageId)
      properties[names.team] = { relation: [{ id: team.pageId }] };
  } else if (columns.team === "select") {
    properties[names.team] = {
      select: { name: TEAM_AREA[input.teamId] ?? team.name },
    };
  } else if (columns.team === "multi_select") {
    properties[names.team] = {
      multi_select: [{ name: TEAM_AREA[input.teamId] ?? team.name }],
    };
  } else if (columns.team === "rich_text") {
    properties[names.team] = text(team.name);
  }

  if (columns.tags === "multi_select" && input.tags.length > 0)
    properties[names.tags] = {
      multi_select: input.tags.map((name) => ({ name })),
    };

  if (columns.visibility === "select")
    properties[names.visibility] = {
      select: { name: VISIBILITY_LABEL[input.visibility] },
    };
  return properties;
}

async function readColumns(): Promise<ResourceColumns> {
  const { client, call } = createNotionClient();
  const source = (await call(() =>
    client.dataSources.retrieve({ data_source_id: dataSourceId("resources") }),
  )) as unknown as { properties?: Record<string, { type?: string }> };
  const names = notionSchema.resources.properties;
  const kind = (name: string) =>
    (source.properties?.[name]?.type as Kind | undefined) ?? null;
  return {
    type: kind(names.type),
    team: kind(names.team),
    tags: kind(names.tags),
    visibility: kind(names.visibility),
  };
}

export async function createResourcePage(
  input: ResourceInput,
  teamName: string,
) {
  const columns = await readColumns();
  let pageId: string | undefined;
  if (columns.team === "relation") {
    const teams = await notionTeams().list();
    pageId = teams.find(
      (item) => foldName(item.name) === foldName(teamName),
    )?.id;
  }
  const properties = resourceProperties(input, columns, {
    name: teamName,
    ...(pageId ? { pageId } : {}),
  });
  const { client, call } = createNotionClient();
  const created = await call(() =>
    client.pages.create({
      parent: {
        type: "data_source_id",
        data_source_id: dataSourceId("resources"),
      },
      properties: properties as never,
    }),
  );
  return created.id;
}

/**
 * Turns a failure from `createResourcePage` into a message an admin can act
 * on. Notion's own text is only appended for validation errors, which name
 * the offending column and never contain secrets.
 */
export function describeResourceError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const missing = /^Missing (NOTION_\w+)$/.exec(message);
  if (missing) {
    return `Falta la variable ${missing[1]} en el entorno (Vercel → Settings → Environment Variables).`;
  }
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  switch (code) {
    case "unauthorized":
      return "El token de Notion no es válido. Revisa NOTION_ZEEK_TOKEN.";
    case "restricted_resource":
      return "La integración de Notion no tiene permiso para insertar contenido en la base Recursos. Actívalo en la integración.";
    case "object_not_found":
      return "La integración de Notion no ve la base Recursos. Compártela con la integración (Conexiones) o revisa NOTION_DS_RESOURCES.";
    case "validation_error":
      return `Notion rechazó el recurso: ${message.slice(0, 200)}`;
    case "rate_limited":
      return "Notion está limitando las peticiones. Intenta de nuevo en un minuto.";
    default:
      return "No se pudo guardar el recurso en Notion.";
  }
}
