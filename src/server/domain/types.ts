export type Role = "volunteer" | "head" | "admin";

export type VolunteerStatus = "active" | "onboarding" | "inactive";

export type TaskStatus = "not_started" | "blocked" | "in_progress" | "done";

export type Priority = "P0" | "P1" | "P2" | "P3";

export type DateRange = {
  start?: string;
  end?: string;
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
  updatedAt: string;
};

export type Actor = {
  userId: string;
  volunteerId: string | null;
  username: string;
  displayName: string;
  role: Role;
  teamIds: string[];
  headOfTeamIds: string[];
  banned: boolean;
  mustChangePassword: boolean;
  privacyAcceptedAt: string | null;
  tempPasswordExpiresAt: string | null;
};
