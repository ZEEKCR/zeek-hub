import type { Actor } from "@/server/domain/types";

export function foldName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The Encargado column in Notion is a select, not a person. Its option name is
 * the account's full name, so the folded name is the stable assignee key.
 */
export function assigneeToken(name: string) {
  return `enc:${foldName(name)}`;
}

/** Every id a task may carry for this account: Notion volunteer, Notion user, Encargado name. */
export function actorAssigneeKeys(
  actor: Pick<Actor, "volunteerId" | "notionUserId" | "fullName">,
) {
  return [
    actor.volunteerId,
    actor.notionUserId,
    actor.fullName ? assigneeToken(actor.fullName) : null,
  ].filter((id): id is string => Boolean(id));
}
