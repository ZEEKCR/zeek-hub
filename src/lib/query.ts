export function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function searchRecord(
  source: Record<string, string | string[] | undefined>,
) {
  const record: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(source)) {
    const single = one(value);
    if (single) record[key] = single;
  }
  return record;
}
