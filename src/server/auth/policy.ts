import type { Actor, Role } from "@/server/domain/types";

export type Action =
  | "content.view"
  | "tasks.view"
  | "tasks.edit"
  | "tasks.create"
  | "users.create"
  | "users.resetPassword"
  | "users.unlock"
  | "users.deactivate"
  | "users.changeRole"
  | "volunteers.viewContact"
  | "resources.viewCore"
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

function isSubset(inner: string[], outer: string[]) {
  return inner.every((id) => outer.includes(id));
}

function managesVolunteer(
  actor: Actor,
  target: { role: Role; teamIds: string[] },
) {
  if (actor.role === "admin") return true;
  return (
    actor.role === "head" &&
    target.role === "volunteer" &&
    isSubset(target.teamIds, actor.headOfTeamIds)
  );
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
    case "tasks.edit": {
      if (resource.kind !== "task") return false;
      if (actor.volunteerId && resource.assigneeIds.includes(actor.volunteerId))
        return true;
      if (actor.role === "admin") return true;
      return (
        actor.role === "head" && overlaps(resource.teamIds, actor.headOfTeamIds)
      );
    }
    case "tasks.create": {
      if (actor.role === "admin") return true;
      if (actor.role !== "head" || resource.kind !== "task") return false;
      return overlaps(resource.teamIds, actor.headOfTeamIds);
    }
    case "users.create":
    case "users.resetPassword":
    case "users.unlock":
    case "users.deactivate": {
      if (resource.kind !== "user") return false;
      return managesVolunteer(actor, resource);
    }
    case "users.changeRole":
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
    default:
      return false;
  }
}

export const POLICY_ACTIONS: Action[] = [
  "content.view",
  "tasks.view",
  "tasks.edit",
  "tasks.create",
  "users.create",
  "users.resetPassword",
  "users.unlock",
  "users.deactivate",
  "users.changeRole",
  "volunteers.viewContact",
  "resources.viewCore",
  "admin.sync",
  "admin.audit",
  "admin.tokens",
];
