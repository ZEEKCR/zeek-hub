import { foldName } from "@/server/domain/assignee";
import type { Activity, ActivityStage } from "@/server/domain/types";

/** A project is an Activities row whose Type is Project (or Proyecto). */
export function isProject(activity: Pick<Activity, "kind">) {
  const kind = foldName(activity.kind);
  return kind === "project" || kind === "proyecto";
}

export function activityKindLabel(kind: string) {
  return foldName(kind) === "project" ? "Proyecto" : kind;
}

const STAGE_RANK: Record<ActivityStage, number> = {
  execution: 0,
  development: 1,
  idea: 2,
  finished: 3,
  cancelled: 4,
};

/** Active work first, then ideas; ties by title. */
export function compareProjects(
  left: Pick<Activity, "stage" | "title">,
  right: Pick<Activity, "stage" | "title">,
) {
  return (
    STAGE_RANK[left.stage] - STAGE_RANK[right.stage] ||
    left.title.localeCompare(right.title, "es")
  );
}

export function isOpenProject(activity: Activity) {
  return (
    isProject(activity) &&
    activity.stage !== "finished" &&
    activity.stage !== "cancelled"
  );
}
