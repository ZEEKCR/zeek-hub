import { authorize } from "@/server/auth/policy";
import type {
  Activity,
  Actor,
  ResourceItem,
  Task,
} from "@/server/domain/types";
import { formatCostaRica } from "@/lib/dates";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { collapsePeople } from "@/server/catalog/people";
import type { NotionPerson } from "@/server/repositories/notion/mappers";

export type CatalogPerson = {
  id: string;
  name: string;
  teamId: string;
  aliasIds: string[];
};

export type CatalogTeam = {
  id: string;
  name: string;
  headIds: string[];
};

export type Catalog = {
  connected: boolean;
  notice?: string;
  people: CatalogPerson[];
  teams: CatalogTeam[];
  tasks: Task[];
  activities: Activity[];
  resources: ResourceItem[];
};

export function dayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatCostaRica(date, "yyyy-MM-dd");
}

export function todayKey() {
  return dayKey(new Date());
}

export function canEditTask(actor: Actor, task: Task) {
  return authorize(actor, "tasks.edit", {
    kind: "task",
    assigneeIds: task.assigneeIds,
    teamIds: task.teamIds,
  });
}

export function canMoveTask(actor: Actor, task: Task) {
  return authorize(actor, "tasks.move", {
    kind: "task",
    assigneeIds: task.assigneeIds,
    teamIds: task.teamIds,
  });
}

/** Events belong to Head only. */
export function canEditActivity(actor: Actor) {
  return actor.role === "admin";
}

export function canSeeContact(actor: Actor, teamIds: string[]) {
  return authorize(actor, "volunteers.viewContact", {
    kind: "volunteer",
    teamIds,
  });
}

export function emptyCatalog(): Catalog {
  return {
    connected: false,
    people: [],
    teams: [],
    tasks: [],
    activities: [],
    resources: [],
  };
}

export function assembleCatalog(input: {
  people: NotionPerson[];
  tasks: Task[];
  activities: Activity[];
  resources: ResourceItem[];
  teams?: CatalogTeam[];
}): Catalog {
  const teamName = new Map(INITIAL_TEAMS.map((team) => [team.id, team.name]));
  for (const team of input.teams ?? []) teamName.set(team.id, team.name);
  for (const task of input.tasks) {
    for (const teamId of task.teamIds) {
      if (!teamName.has(teamId)) teamName.set(teamId, teamId);
    }
  }
  const personTeam = new Map<string, string>();
  for (const task of input.tasks) {
    const teamId = task.teamIds[0];
    if (!teamId) continue;
    for (const personId of task.assigneeIds) {
      if (!personTeam.has(personId)) personTeam.set(personId, teamId);
    }
  }
  const collapsed = collapsePeople(input.people);
  const people = collapsed.map((person) => {
    const teamId = [person.id, ...person.aliasIds]
      .map((id) => personTeam.get(id))
      .find((id) => Boolean(id));
    return {
      id: person.id,
      name: person.name,
      aliasIds: person.aliasIds,
      teamId: teamId ?? "",
    };
  });
  return {
    connected: true,
    people,
    teams: [...teamName.entries()].map(([id, name]) => ({
      id,
      name,
      headIds: [],
    })),
    tasks: input.tasks,
    activities: input.activities,
    resources: input.resources,
  };
}

export function viewOf(catalog: Catalog) {
  return {
    personName(id: string) {
      const match = catalog.people.find(
        (person) => person.id === id || person.aliasIds.includes(id),
      );
      return match?.name ?? "Sin asignar";
    },
    personIds(id: string) {
      const match = catalog.people.find((person) => person.id === id);
      return match ? [match.id, ...match.aliasIds] : [id];
    },
    teamName(id: string) {
      return catalog.teams.find((team) => team.id === id)?.name ?? "Equipo";
    },
    activityTitle(id: string) {
      return (
        catalog.activities.find((activity) => activity.id === id)?.title ?? ""
      );
    },
    publishedActivities() {
      return catalog.activities.filter((activity) => activity.published);
    },
    taskProgress(activityId: string) {
      const related = catalog.tasks.filter((task) =>
        task.activityIds.includes(activityId),
      );
      if (related.length === 0) return 0;
      const done = related.filter((task) => task.status === "done").length;
      return Math.round((done / related.length) * 100);
    },
    visibleResources(actor: Actor) {
      const core = authorize(actor, "resources.viewCore");
      return catalog.resources.filter(
        (resource) => resource.visibility === "volunteers" || core,
      );
    },
  };
}
