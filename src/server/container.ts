import { getEnv } from "@/env";
import {
  memoryTeams,
  memoryVolunteers,
} from "@/server/repositories/memory/store";
import {
  notionTeams,
  notionVolunteers,
} from "@/server/repositories/notion/repos";
import type { Repositories } from "@/server/repositories/interfaces";

let live: Repositories | undefined;
let memory: Repositories | undefined;

export function repositories(): Repositories {
  if (getEnv().NOTION_MODE !== "live") {
    memory ??= { volunteers: memoryVolunteers(), teams: memoryTeams() };
    return memory;
  }
  live ??= { volunteers: notionVolunteers(), teams: notionTeams() };
  return live;
}
