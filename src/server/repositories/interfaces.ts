import type { Team, Volunteer } from "@/server/domain/types";

export interface VolunteerRepository {
  list(): Promise<Volunteer[]>;
  get(id: string): Promise<Volunteer | null>;
  findByUserId(userId: string): Promise<Volunteer | null>;
  upsert(volunteer: Volunteer): Promise<Volunteer>;
}

export interface TeamRepository {
  list(): Promise<Team[]>;
  get(id: string): Promise<Team | null>;
  upsert(team: Team): Promise<Team>;
}

export type Repositories = {
  volunteers: VolunteerRepository;
  teams: TeamRepository;
};
