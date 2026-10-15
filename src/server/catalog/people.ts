export type NamedPerson = { id: string; name: string };

export type CollapsedPerson = NamedPerson & { aliasIds: string[] };

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isEmail(value: string) {
  return value.includes("@");
}

function tokens(value: string) {
  return fold(value)
    .split(" ")
    .filter((token) => token.length >= 4);
}

function readableName(value: string) {
  const letters = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (!letters || letters !== letters.toUpperCase()) return value.trim();
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((part) =>
      part ? part.charAt(0).toLocaleUpperCase("es") + part.slice(1) : part,
    )
    .join(" ");
}

function levenshtein(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j] ?? 0;
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(current + 1, (row[j - 1] ?? 0) + 1, previous + cost);
      previous = current;
    }
  }
  return row[right.length] ?? 0;
}

function samePerson(left: string, right: string) {
  if (fold(left) === fold(right)) return true;
  const email = [left, right].find((name) => isEmail(name));
  const other = email === left ? right : email === right ? left : "";
  if (email && other && !isEmail(other)) {
    const local = (fold(email).split("@")[0] ?? "").replace(/[^a-z]/g, "");
    return tokens(other).some(
      (token) => token.length >= 5 && local.includes(token),
    );
  }
  const foldedLeft = fold(left);
  const foldedRight = fold(right);
  const short =
    foldedLeft.split(" ").length === 1
      ? foldedLeft
      : foldedRight.split(" ").length === 1
        ? foldedRight
        : "";
  const long = short === foldedLeft ? right : short === foldedRight ? left : "";
  if (!short || !long || isEmail(long)) return false;
  const parts = tokens(long);
  if (parts.length < 2) return false;
  const ends = [parts[0], parts[parts.length - 1]].filter(
    (part): part is string => Boolean(part),
  );
  const compact = short.replace(/[^a-z]/g, "");
  return ends.some(
    (part) => part.length >= 4 && levenshtein(part, compact) <= 1,
  );
}

function preferred(left: string, right: string) {
  const leftTokens = tokens(left).length;
  const rightTokens = tokens(right).length;
  if (leftTokens !== rightTokens)
    return leftTokens > rightTokens ? left : right;
  const leftCaps = left === left.toUpperCase();
  const rightCaps = right === right.toUpperCase();
  if (leftCaps !== rightCaps) return leftCaps ? right : left;
  return left.length >= right.length ? left : right;
}

export function collapsePeople(input: NamedPerson[]): CollapsedPerson[] {
  const people = input.filter(
    (person) => person.name.trim() && fold(person.name) !== "zeek",
  );
  const parent = people.map((_, index) => index);
  const find = (index: number): number => {
    const current = parent[index] ?? index;
    if (current === index) return index;
    const root = find(current);
    parent[index] = root;
    return root;
  };
  const unite = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };
  for (let left = 0; left < people.length; left += 1) {
    for (let right = left + 1; right < people.length; right += 1) {
      const leftName = people[left]?.name ?? "";
      const rightName = people[right]?.name ?? "";
      if (samePerson(leftName, rightName)) unite(left, right);
    }
  }
  const groups = new Map<number, NamedPerson[]>();
  people.forEach((person, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), person]);
  });
  return [...groups.values()].map((group) => {
    const name = group.reduce(
      (best, person) => preferred(best, person.name),
      group[0]?.name ?? "",
    );
    const canonical = group.find((person) => person.name === name) ?? group[0];
    return {
      id: canonical?.id ?? "",
      name: readableName(name),
      aliasIds: group
        .map((person) => person.id)
        .filter((id) => id !== canonical?.id),
    };
  });
}
