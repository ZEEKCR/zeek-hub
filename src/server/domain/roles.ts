import type { Role } from "@/server/domain/types";

/**
 * Stored role values stay `admin`, `head` and `volunteer`; these are the names
 * people see. Head can do everything, Lead manages tasks, Voluntario moves
 * the tasks assigned to them.
 */
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Head",
  head: "Lead",
  volunteer: "Voluntario",
};

export const ROLE_ORDER: Role[] = ["admin", "head", "volunteer"];

export function roleLabel(role: string) {
  return ROLE_LABEL[role as Role] ?? "Voluntario";
}

export function isRole(value: unknown): value is Role {
  return value === "admin" || value === "head" || value === "volunteer";
}
