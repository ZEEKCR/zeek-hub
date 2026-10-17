import { foldName } from "@/server/domain/assignee";

export type SearchKind = "tarea" | "evento" | "recurso" | "persona";

export type SearchResult = {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  external?: boolean;
};

export type SearchData = {
  tasks: { id: string; title: string; status: string }[];
  activities: { id: string; title: string; kind: string }[];
  resources: { id: string; title: string; url: string; tags: string[] }[];
  people: { id: string; name: string; team: string; jobTitle: string }[];
};

export const MIN_QUERY = 2;
const PER_KIND = 5;

function matches(needle: string, ...fields: string[]) {
  return foldName(fields.join(" ")).includes(needle);
}

/** Accent-insensitive search over everything a volunteer is allowed to see. */
export function searchAll(query: string, data: SearchData): SearchResult[] {
  const needle = foldName(query);
  if (needle.length < MIN_QUERY) return [];
  const results: SearchResult[] = [];
  const take = <T>(items: T[], test: (item: T) => boolean) =>
    items.filter(test).slice(0, PER_KIND);

  for (const task of take(data.tasks, (item) => matches(needle, item.title))) {
    results.push({
      kind: "tarea",
      id: task.id,
      title: task.title,
      subtitle: task.status,
      href: `/tareas/${task.id}`,
    });
  }
  for (const activity of take(data.activities, (item) =>
    matches(needle, item.title),
  )) {
    results.push({
      kind: "evento",
      id: activity.id,
      title: activity.title,
      subtitle: activity.kind,
      href: `/eventos/${activity.id}`,
    });
  }
  for (const resource of take(data.resources, (item) =>
    matches(needle, item.title, item.tags.join(" ")),
  )) {
    results.push({
      kind: "recurso",
      id: resource.id,
      title: resource.title,
      subtitle: resource.tags.join(", "),
      href: resource.url,
      external: true,
    });
  }
  for (const person of take(data.people, (item) =>
    matches(needle, item.name, item.team, item.jobTitle),
  )) {
    results.push({
      kind: "persona",
      id: person.id,
      title: person.name,
      subtitle: [person.jobTitle, person.team].filter(Boolean).join(" · "),
      href: `/personas?q=${encodeURIComponent(person.name)}`,
    });
  }
  return results;
}
