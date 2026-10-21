import type { CountryId, Scope } from "@/server/domain/countries";

export type Role = "volunteer" | "head" | "admin";

export type VolunteerStatus = "active" | "onboarding" | "inactive";

export type TaskStatus = "not_started" | "blocked" | "in_progress" | "done";

export type ActivityStage =
  "idea" | "development" | "execution" | "finished" | "cancelled";

export type Priority = "P0" | "P1" | "P2" | "P3";

export type DateRange = {
  start?: string;
  end?: string;
  /** False when Notion stored a date without a time. */
  timed?: boolean;
};

export type Volunteer = {
  id: string;
  name: string;
  email?: string;
  username?: string;
  userId?: string;
  role: Role;
  status: VolunteerStatus;
  teamIds: string[];
  primaryTeamId?: string;
  phone?: string;
  photoUrl?: string;
  notionUserId?: string;
  updatedAt: string;
};

export type Team = {
  id: string;
  name: string;
  description?: string;
  headIds: string[];
  memberIds: string[];
  channelUrl?: string;
  active: boolean;
  legacyAreas: string[];
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: Priority;
  dueDate?: DateRange;
  assigneeIds: string[];
  teamIds: string[];
  activityIds: string[];
  notes?: string;
  area?: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  title: string;
  kind: string;
  stage: ActivityStage;
  published: boolean;
  place?: string;
  format?: string;
  link?: string;
  notes?: string;
  start?: string;
  end?: string;
  /** False when Notion stored a date without a time. */
  timed?: boolean;
  teamIds: string[];
  volunteerIds: string[];
  /** Where the event happens, or "global". Missing means Notion has no País for it. */
  country?: Scope;
};

export type ResourceItem = {
  id: string;
  title: string;
  url: string;
  type: string;
  teamId: string;
  tags: string[];
  visibility: "volunteers" | "core";
};

export type Actor = {
  userId: string;
  volunteerId: string | null;
  notionUserId?: string | null;
  username: string;
  displayName: string;
  /** Full name typed at account creation; matches the Encargado option. */
  fullName?: string;
  /** Primary department (team id) assigned in the profile. */
  teamId?: string | null;
  /** Job title shown on the profile, not the permission role. */
  jobTitle?: string | null;
  role: Role;
  teamIds: string[];
  headOfTeamIds: string[];
  banned: boolean;
  mustChangePassword: boolean;
  privacyAcceptedAt: string | null;
  tempPasswordExpiresAt: string | null;
  /** Null until the person finishes or skips the first-visit welcome. */
  welcomeSeenAt?: string | null;
  /** Country of the account; Costa Rica for every account created before countries existed. */
  country?: CountryId;
};
