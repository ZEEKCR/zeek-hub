import { getEnv } from "@/env";
import {
  isMissingNotionSource,
  mergePeople,
  readActivities,
  readResources,
  readTasks,
} from "@/server/repositories/notion/repos";
import {
  assembleCatalog,
  emptyCatalog,
  type Catalog,
} from "@/server/catalog/view";

let cached: { at: number; value: Catalog } | undefined;

export function invalidateCatalog() {
  cached = undefined;
}

export async function loadCatalog(): Promise<Catalog> {
  const env = getEnv();
  if (env.NOTION_MODE !== "live" || !env.NOTION_ZEEK_TOKEN)
    return emptyCatalog();
  if (cached && Date.now() - cached.at < 20_000) return cached.value;
  try {
    const [tasks, activities, resources] = await Promise.all([
      env.NOTION_DS_TASKS ? readTasks() : { tasks: [], people: [] },
      env.NOTION_DS_ACTIVITIES
        ? readActivities()
        : { activities: [], people: [] },
      env.NOTION_DS_RESOURCES ? readResources() : [],
    ]);
    const value = assembleCatalog({
      people: mergePeople([tasks.people, activities.people]),
      tasks: tasks.tasks,
      activities: activities.activities,
      resources,
    });
    cached = { at: Date.now(), value };
    return value;
  } catch (error) {
    if (!isMissingNotionSource(error)) throw error;
    return {
      ...emptyCatalog(),
      notice:
        "Comparte las bases Tasks y Activities con la integración ZEEK Hub.",
    };
  }
}
