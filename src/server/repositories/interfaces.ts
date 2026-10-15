import type {
  Activity,
  ResourceItem,
  Task,
  Team,
  Volunteer,
} from "@/server/domain/types";

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

export interface TaskRepository {
  list(): Promise<Task[]>;
}

export interface ActivityRepository {
  list(): Promise<Activity[]>;
}

export interface ResourceRepository {
  list(): Promise<ResourceItem[]>;
}

export type Repositories = {
  volunteers: VolunteerRepository;
  teams: TeamRepository;
  tasks: TaskRepository;
  activities: ActivityRepository;
  resources: ResourceRepository;
};
