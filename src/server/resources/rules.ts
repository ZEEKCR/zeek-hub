import { foldName } from "@/server/domain/assignee";

export const RESOURCE_TYPES = [
  "Guía",
  "Plantilla",
  "Checklist",
  "Nota",
] as const;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const UPLOAD_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "text/plain",
  "text/csv",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export type ResourceVisibility = "volunteers" | "core";

export type ResourceInput = {
  title: string;
  url: string;
  type: (typeof RESOURCE_TYPES)[number];
  teamId: string;
  tags: string[];
  visibility: ResourceVisibility;
};

export function parseTags(value: string) {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const piece of value.split(",")) {
    const tag = piece.trim().replace(/\s+/g, " ");
    if (!tag || tag.length > 30) continue;
    const key = foldName(tag);
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === 10) break;
  }
  return tags;
}

export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".");
  } catch {
    return false;
  }
}

type Raw = {
  title: string;
  url: string;
  type: string;
  teamId: string;
  tags: string;
  visibility: string;
};

export function validateResourceInput(
  raw: Raw,
  knownTeamIds: string[],
): { ok: true; data: ResourceInput } | { ok: false; message: string } {
  const title = raw.title.trim().replace(/\s+/g, " ");
  const url = raw.url.trim();
  if (title.length < 2 || title.length > 120) {
    return {
      ok: false,
      message: "El título debe tener entre 2 y 120 caracteres.",
    };
  }
  if (!isHttpsUrl(url) || url.length > 1000) {
    return {
      ok: false,
      message: "Sube un archivo o pega un enlace https válido.",
    };
  }
  const type = RESOURCE_TYPES.find((item) => item === raw.type);
  if (!type) return { ok: false, message: "El tipo no es válido." };
  if (!knownTeamIds.includes(raw.teamId)) {
    return { ok: false, message: "El equipo no existe." };
  }
  const visibility: ResourceVisibility =
    raw.visibility === "core" ? "core" : "volunteers";
  return {
    ok: true,
    data: {
      title,
      url,
      type,
      teamId: raw.teamId,
      tags: parseTags(raw.tags),
      visibility,
    },
  };
}
