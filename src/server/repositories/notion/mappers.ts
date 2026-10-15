import { z } from "zod";
import type {
  Activity,
  Priority,
  ResourceItem,
  Role,
  Task,
  TaskStatus,
  Team,
  Volunteer,
  VolunteerStatus,
} from "@/server/domain/types";
import { notionSchema } from "@/server/repositories/notion/schema";

const volunteerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  username: z.string().optional(),
  userId: z.string().optional(),
  role: z.enum(["volunteer", "head", "admin"]),
  status: z.enum(["active", "onboarding", "inactive"]),
  teamIds: z.array(z.string()),
  primaryTeamId: z.string().optional(),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  notionUserId: z.string().optional(),
  updatedAt: z.string(),
});

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  headIds: z.array(z.string()),
  memberIds: z.array(z.string()),
  channelUrl: z.string().optional(),
  active: z.boolean(),
  legacyAreas: z.array(z.string()),
  updatedAt: z.string(),
});

type Property = {
  type?: string;
  title?: { plain_text?: string }[];
  rich_text?: { plain_text?: string }[];
  email?: string | null;
  phone_number?: string | null;
  select?: { name?: string } | null;
  checkbox?: boolean;
  url?: string | null;
  relation?: { id: string }[];
  multi_select?: { name: string }[];
  status?: { name?: string } | null;
  date?: { start?: string | null; end?: string | null } | null;
  people?: { id?: string; name?: string | null }[];
  last_edited_time?: string;
};

export type NotionPerson = { id: string; name: string };

const AREA_TO_TEAM: Record<string, string> = {
  Growth: "team-growth",
  Partners: "team-growth",
  Ops: "team-operations",
  Volunteers: "team-operations",
  Events: "team-operations",
  Services: "team-operations",
  Community: "team-communications",
  Content: "team-communications",
  Platform: "team-technical",
  Blockchain: "team-technical",
  Logistics: "team-logistics",
};

const taskStatusFromNotion: Record<string, TaskStatus> = {
  "Not started": "not_started",
  Blocked: "blocked",
  "In progress": "in_progress",
  Done: "done",
};

export function notionStatusName(status: TaskStatus) {
  const match = Object.entries(taskStatusFromNotion).find(
    ([, value]) => value === status,
  );
  return match?.[0] ?? null;
}

function includesTime(value: string | null | undefined) {
  return Boolean(value?.includes("T"));
}

const priorities = new Set<Priority>(["P0", "P1", "P2", "P3"]);

function textOf(property: Property | undefined) {
  const parts = property?.title ?? property?.rich_text ?? [];
  const value = parts
    .map((part) => part.plain_text ?? "")
    .join("")
    .trim();
  return value || undefined;
}

function relations(property: Property | undefined) {
  return (property?.relation ?? []).map((item) => item.id);
}

function peopleOf(property: Property | undefined): NotionPerson[] {
  return (property?.people ?? []).flatMap((person) => {
    if (!person.id) return [];
    return [{ id: person.id, name: person.name?.trim() || "Sin nombre" }];
  });
}

function dateValue(value: string | null | undefined) {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T18:00:00.000Z`;
  return value;
}

export function teamIdForArea(area: string | undefined) {
  if (!area) return undefined;
  return (
    AREA_TO_TEAM[area] ?? `area-${area.toLowerCase().replaceAll(/\s+/g, "-")}`
  );
}

const roleFromNotion: Record<string, Role> = {
  Voluntario: "volunteer",
  "Líder de equipo": "head",
  Admin: "admin",
};

const statusFromNotion: Record<string, VolunteerStatus> = {
  Activo: "active",
  Onboarding: "onboarding",
  Inactivo: "inactive",
};

export function mapVolunteerPage(page: {
  id: string;
  last_edited_time?: string;
  properties: Record<string, Property>;
}): Volunteer | null {
  const names = notionSchema.volunteers.properties;
  const properties = page.properties;
  const roleName = properties[names.role]?.select?.name;
  const statusName = properties[names.status]?.select?.name;
  const primary = relations(properties[names.primaryTeam])[0];
  const parsed = volunteerSchema.safeParse({
    id: page.id,
    name: textOf(properties[names.name]) ?? "Sin nombre",
    email: properties[names.email]?.email ?? undefined,
    username: textOf(properties[names.username]),
    userId: textOf(properties[names.userId]),
    role: (roleName && roleFromNotion[roleName]) || "volunteer",
    status: (statusName && statusFromNotion[statusName]) || "active",
    teamIds: [
      ...(primary ? [primary] : []),
      ...relations(properties[names.secondaryTeams]),
    ],
    primaryTeamId: primary,
    phone: properties[names.phone]?.phone_number ?? undefined,
    updatedAt: page.last_edited_time ?? new Date().toISOString(),
  });
  if (!parsed.success) {
    console.warn("Discarding invalid volunteer page", page.id);
    return null;
  }
  const data = parsed.data;
  const volunteer: Volunteer = {
    id: data.id,
    name: data.name,
    role: data.role,
    status: data.status,
    teamIds: data.teamIds,
    updatedAt: data.updatedAt,
  };
  if (data.email) volunteer.email = data.email;
  if (data.username) volunteer.username = data.username;
  if (data.userId) volunteer.userId = data.userId;
  if (data.primaryTeamId) volunteer.primaryTeamId = data.primaryTeamId;
  if (data.phone) volunteer.phone = data.phone;
  if (data.photoUrl) volunteer.photoUrl = data.photoUrl;
  if (data.notionUserId) volunteer.notionUserId = data.notionUserId;
  return volunteer;
}

export function mapTeamPage(page: {
  id: string;
  last_edited_time?: string;
  properties: Record<string, Property>;
}): Team | null {
  const names = notionSchema.teams.properties;
  const properties = page.properties;
  const parsed = teamSchema.safeParse({
    id: page.id,
    name: textOf(properties[names.name]) ?? "Sin nombre",
    description: textOf(properties[names.description]),
    headIds: relations(properties[names.head]),
    memberIds: relations(properties[names.members]),
    channelUrl: properties[names.channel]?.url ?? undefined,
    active: properties[names.active]?.checkbox ?? true,
    legacyAreas: (properties[names.legacyAreas]?.multi_select ?? []).map(
      (item) => item.name,
    ),
    updatedAt: page.last_edited_time ?? new Date().toISOString(),
  });
  if (!parsed.success) {
    console.warn("Discarding invalid team page", page.id);
    return null;
  }
  const data = parsed.data;
  const team: Team = {
    id: data.id,
    name: data.name,
    headIds: data.headIds,
    memberIds: data.memberIds,
    active: data.active,
    legacyAreas: data.legacyAreas,
    updatedAt: data.updatedAt,
  };
  if (data.description) team.description = data.description;
  if (data.channelUrl) team.channelUrl = data.channelUrl;
  return team;
}

export function volunteerToProperties(volunteer: Volunteer) {
  const names = notionSchema.volunteers.properties;
  const roleLabel = notionSchema.volunteers.roleMap[volunteer.role];
  const statusLabel = notionSchema.volunteers.statusMap[volunteer.status];
  return {
    [names.name]: { title: [{ text: { content: volunteer.name } }] },
    [names.username]: {
      rich_text: [{ text: { content: volunteer.username ?? "" } }],
    },
    [names.userId]: {
      rich_text: [{ text: { content: volunteer.userId ?? "" } }],
    },
    ...(volunteer.email ? { [names.email]: { email: volunteer.email } } : {}),
    [names.role]: { select: { name: roleLabel } },
    [names.status]: { select: { name: statusLabel } },
    ...(volunteer.phone
      ? { [names.phone]: { phone_number: volunteer.phone } }
      : {}),
    ...(volunteer.primaryTeamId
      ? { [names.primaryTeam]: { relation: [{ id: volunteer.primaryTeamId }] } }
      : {}),
  };
}

export function mapTaskPage(page: {
  id: string;
  last_edited_time?: string;
  properties: Record<string, Property>;
}): { task: Task; people: NotionPerson[] } | null {
  const names = notionSchema.tasks.properties;
  const properties = page.properties;
  const title = textOf(properties[names.title]);
  if (!title) return null;
  const statusName = properties[names.status]?.status?.name;
  const priorityName = properties[names.priority]?.select?.name;
  const due = properties[names.due]?.date;
  const start = dateValue(due?.start);
  const end = dateValue(due?.end);
  const area = properties[names.areaLegacy]?.select?.name;
  const teamFromArea = teamIdForArea(area);
  const teamIds = [
    ...relations(properties[names.team]),
    ...(teamFromArea ? [teamFromArea] : []),
  ];
  const people = [
    ...peopleOf(properties[names.assigneeLegacy]),
    ...peopleOf(properties[names.responsible]),
  ];
  const assigneeIds = [
    ...new Set([
      ...people.map((person) => person.id),
      ...relations(properties[names.responsible]),
    ]),
  ];
  const task: Task = {
    id: page.id,
    title,
    status: (statusName && taskStatusFromNotion[statusName]) || "not_started",
    assigneeIds,
    teamIds: [...new Set(teamIds)],
    activityIds: relations(properties[names.activity]),
    updatedAt: page.last_edited_time ?? new Date().toISOString(),
  };
  if (priorityName && priorities.has(priorityName as Priority)) {
    task.priority = priorityName as Priority;
  }
  if (start) {
    task.dueDate = {
      start,
      ...(end ? { end } : {}),
      timed: includesTime(due?.start) || includesTime(due?.end),
    };
  }
  const notes = textOf(properties[names.notes]);
  if (notes) task.notes = notes;
  return { task, people };
}

export function mapActivityPage(page: {
  id: string;
  last_edited_time?: string;
  properties: Record<string, Property>;
}): { activity: Activity; people: NotionPerson[] } | null {
  const names = notionSchema.activities.properties;
  const properties = page.properties;
  const title = textOf(properties[names.title]);
  if (!title) return null;
  const statusName = properties[names.status]?.select?.name;
  const publish = properties[names.publish]?.checkbox;
  const date = properties[names.date]?.date;
  const owners = peopleOf(properties[names.owner]);
  const activity: Activity = {
    id: page.id,
    title,
    kind: properties[names.type]?.select?.name ?? "Actividad",
    published: publish ?? statusName !== "Cancelled",
    teamIds: relations(properties[names.teams]),
    volunteerIds: [
      ...new Set([
        ...owners.map((person) => person.id),
        ...relations(properties[names.volunteers]),
        ...relations(properties[names.coordinator]),
      ]),
    ],
  };
  const start = dateValue(date?.start);
  const end = dateValue(date?.end);
  const place = textOf(properties[names.place]);
  const format =
    properties[names.format]?.select?.name ?? textOf(properties[names.format]);
  const link =
    properties[names.registrationLink]?.url ??
    properties[names.info]?.url ??
    properties[names.board]?.url ??
    undefined;
  if (start) {
    activity.start = start;
    activity.timed = includesTime(date?.start) || includesTime(date?.end);
  }
  if (end) activity.end = end;
  if (place) activity.place = place;
  if (format) activity.format = format;
  if (link) activity.link = link;
  return { activity, people: owners };
}

export function mapResourcePage(page: {
  id: string;
  properties: Record<string, Property>;
}): ResourceItem | null {
  const names = notionSchema.resources.properties;
  const properties = page.properties;
  const title = textOf(properties[names.title]);
  const url = properties[names.url]?.url;
  if (!title || !url) return null;
  const visibilityName = properties[names.visibility]?.select?.name;
  const teamId =
    relations(properties[names.team])[0] ??
    teamIdForArea(properties[names.team]?.select?.name) ??
    "team-operations";
  return {
    id: page.id,
    title,
    url,
    type: properties[names.type]?.select?.name ?? "Nota",
    teamId,
    tags: (properties[names.tags]?.multi_select ?? []).map((item) => item.name),
    visibility:
      visibilityName === "Núcleo" || visibilityName === "Core"
        ? "core"
        : "volunteers",
  };
}
