import type { Team, Volunteer } from "@/server/domain/types";
import type {
  ActivityRepository,
  ResourceRepository,
  TaskRepository,
  TeamRepository,
  VolunteerRepository,
} from "@/server/repositories/interfaces";

export const INITIAL_TEAMS: Team[] = [
  {
    id: "team-growth",
    name: "Growth",
    headIds: [],
    memberIds: [],
    active: true,
    legacyAreas: ["Growth", "Partners"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "team-operations",
    name: "Operations",
    headIds: [],
    memberIds: [],
    active: true,
    legacyAreas: ["Ops", "Volunteers", "Events"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "team-communications",
    name: "Communications",
    headIds: [],
    memberIds: [],
    active: true,
    legacyAreas: ["Community", "Content"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "team-technical",
    name: "Technical",
    headIds: [],
    memberIds: [],
    active: true,
    legacyAreas: ["Platform", "Blockchain"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "team-logistics",
    name: "Logistics",
    headIds: [],
    memberIds: [],
    active: true,
    legacyAreas: ["Logistics"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
];

const state = {
  volunteers: [] as Volunteer[],
  teams: INITIAL_TEAMS.map((team) => ({ ...team })),
};

export function resetMemoryStore() {
  state.volunteers = [];
  state.teams = INITIAL_TEAMS.map((team) => ({
    ...team,
    headIds: [],
    memberIds: [],
  }));
}

export function memoryVolunteers(): VolunteerRepository {
  return {
    async list() {
      return state.volunteers.map((volunteer) => ({ ...volunteer }));
    },
    async get(id) {
      return state.volunteers.find((volunteer) => volunteer.id === id) ?? null;
    },
    async findByUserId(userId) {
      return (
        state.volunteers.find((volunteer) => volunteer.userId === userId) ??
        null
      );
    },
    async upsert(volunteer) {
      const index = state.volunteers.findIndex(
        (item) => item.id === volunteer.id || item.userId === volunteer.userId,
      );
      if (index >= 0) state.volunteers[index] = volunteer;
      else state.volunteers.push(volunteer);
      return volunteer;
    },
  };
}

export function memoryTeams(): TeamRepository {
  return {
    async list() {
      return state.teams.map((team) => ({ ...team }));
    },
    async get(id) {
      return state.teams.find((team) => team.id === id) ?? null;
    },
    async upsert(team) {
      const index = state.teams.findIndex((item) => item.id === team.id);
      if (index >= 0) state.teams[index] = team;
      else state.teams.push(team);
      return team;
    },
  };
}

export function memoryTasks(): TaskRepository {
  return {
    async list() {
      return [];
    },
  };
}

export function memoryActivities(): ActivityRepository {
  return {
    async list() {
      return [];
    },
  };
}

export function memoryResources(): ResourceRepository {
  return {
    async list() {
      return [];
    },
  };
}
