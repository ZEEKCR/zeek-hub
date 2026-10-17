import { actorAssigneeKeys } from "@/server/domain/assignee";
import type { Actor, Role } from "@/server/domain/types";

export type Action =
  | "content.view"
  | "tasks.view"
  | "tasks.move"
  | "tasks.edit"
  | "tasks.create"
  | "users.create"
  | "users.resetPassword"
  | "users.unlock"
  | "users.deactivate"
  | "users.changeRole"
  | "users.rename"
  | "users.editProfile"
  | "users.delete"
  | "volunteers.viewContact"
  | "resources.viewCore"
  | "resources.create"
  | "birthdays.edit"
  | "events.rsvp"
  | "events.manage"
  | "reports.create"
  | "reports.manage"
  | "admin.sync"
  | "admin.audit"
  | "admin.tokens";

export type Resource =
  | { kind: "none" }
  | { kind: "task"; assigneeIds: string[]; teamIds: string[] }
  | { kind: "user"; role: Role; teamIds: string[] }
  | { kind: "volunteer"; teamIds: string[] }
  | { kind: "resource"; visibility: "volunteers" | "core" };

const NONE: Resource = { kind: "none" };

function overlaps(left: string[], right: string[]) {
  return left.some((id) => right.includes(id));
}

function isLead(actor: Actor) {
  return actor.role === "admin" || actor.role === "head";
}

export function authorize(
  actor: Actor | null,
  action: Action,
  resource: Resource = NONE,
) {
  if (!actor || actor.banned) return false;

  switch (action) {
    case "content.view":
    case "tasks.view":
      return true;
    case "tasks.move": {
      if (resource.kind !== "task") return false;
      if (isLead(actor)) return true;
      const keys = actorAssigneeKeys(actor);
      return resource.assigneeIds.some((id) => keys.includes(id));
    }
    case "tasks.edit":
    case "tasks.create":
      return isLead(actor);
    case "users.create":
    case "users.resetPassword":
    case "users.unlock":
    case "users.deactivate":
    case "users.changeRole":
    case "users.rename":
    case "users.editProfile":
    case "users.delete":
    case "admin.sync":
    case "admin.audit":
    case "admin.tokens":
      return actor.role === "admin";
    case "volunteers.viewContact": {
      if (resource.kind !== "volunteer") return false;
      if (actor.role === "admin") return true;
      return overlaps(resource.teamIds, actor.teamIds);
    }
    case "resources.viewCore":
      return actor.role === "head" || actor.role === "admin";
    case "resources.create":
      return actor.role === "admin";
    case "events.rsvp":
    case "birthdays.edit":
    case "reports.create":
      return true;
    case "reports.manage":
      return actor.role === "admin";
    case "events.manage":
      return isLead(actor);
    default:
      return false;
  }
}

export const POLICY_ACTIONS: Action[] = [
  "content.view",
  "tasks.view",
  "tasks.move",
  "tasks.edit",
  "tasks.create",
  "users.create",
  "users.resetPassword",
  "users.unlock",
  "users.deactivate",
  "users.changeRole",
  "users.rename",
  "users.editProfile",
  "users.delete",
  "volunteers.viewContact",
  "resources.viewCore",
  "resources.create",
  "birthdays.edit",
  "events.rsvp",
  "events.manage",
  "reports.create",
  "reports.manage",
  "admin.sync",
  "admin.audit",
  "admin.tokens",
];
