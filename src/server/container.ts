import { getEnv } from "@/env";
import {
  memoryActivities,
  memoryResources,
  memoryTasks,
  memoryTeams,
  memoryVolunteers,
} from "@/server/repositories/memory/store";
import {
  notionActivities,
  notionResources,
  notionTasks,
  notionTeams,
  notionVolunteers,
} from "@/server/repositories/notion/repos";
import type { Repositories } from "@/server/repositories/interfaces";

let live: Repositories | undefined;
let memory: Repositories | undefined;

export function repositories(): Repositories {
  if (getEnv().NOTION_MODE !== "live") {
    memory ??= {
      volunteers: memoryVolunteers(),
      teams: memoryTeams(),
      tasks: memoryTasks(),
      activities: memoryActivities(),
      resources: memoryResources(),
    };
    return memory;
  }
  live ??= {
    volunteers: notionVolunteers(),
    teams: notionTeams(),
    tasks: notionTasks(),
    activities: notionActivities(),
    resources: notionResources(),
  };
  return live;
}
