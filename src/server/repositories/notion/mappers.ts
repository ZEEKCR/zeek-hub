import { z } from "zod";
import type {
  Role,
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
  last_edited_time?: string;
};

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
