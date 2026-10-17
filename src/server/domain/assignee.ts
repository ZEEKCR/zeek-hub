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
