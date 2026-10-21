import { foldName } from "@/server/domain/assignee";

/** Countries where ZEEK runs events. */
export const COUNTRIES = [
  { id: "cr", name: "Costa Rica", flag: "🇨🇷" },
  { id: "mx", name: "México", flag: "🇲🇽" },
  { id: "sv", name: "El Salvador", flag: "🇸🇻" },
  { id: "co", name: "Colombia", flag: "🇨🇴" },
] as const;

export type CountryId = (typeof COUNTRIES)[number]["id"];

/** An event belongs to one country, or to all of them. */
export type Scope = CountryId | "global";

/** Every account that existed before countries were added is from Costa Rica. */
export const DEFAULT_COUNTRY: CountryId = "cr";

/** An event without a País in Notion is treated as a Costa Rica event. */
export const DEFAULT_SCOPE: Scope = "cr";

export function isCountry(value: string): value is CountryId {
  return COUNTRIES.some((country) => country.id === value);
}

export function countryName(id: CountryId) {
  return COUNTRIES.find((country) => country.id === id)?.name ?? id;
}

export function countryFlag(id: CountryId) {
  return COUNTRIES.find((country) => country.id === id)?.flag ?? "";
}

export function scopeName(scope: Scope) {
  return scope === "global" ? "Global" : countryName(scope);
}

/** The option names the País column of Activities uses in Notion. */
export const NOTION_SCOPE_OPTIONS: { scope: Scope; name: string }[] = [
  { scope: "global", name: "Global" },
  ...COUNTRIES.map((country) => ({ scope: country.id, name: country.name })),
];

/** Reads a country from an id or a name, ignoring accents and case. */
export function parseCountry(raw: string | null | undefined): CountryId | null {
  if (!raw) return null;
  const key = foldName(raw);
  const match = COUNTRIES.find(
    (country) => country.id === key || foldName(country.name) === key,
  );
  return match?.id ?? (key === "mexico" ? "mx" : null);
}

export function parseScope(raw: string | null | undefined): Scope | null {
  if (!raw) return null;
  if (foldName(raw) === "global") return "global";
  return parseCountry(raw);
}

export function activityScope(activity: { country?: Scope | undefined }) {
  return activity.country ?? DEFAULT_SCOPE;
}

/**
 * A task takes the scope of its event; with no event it applies everywhere.
 * With several events the first one that has a country decides.
 */
export function taskScope(
  task: { activityIds: string[] },
  activities: { id: string; country?: Scope | undefined }[],
): Scope {
  for (const id of task.activityIds) {
    const activity = activities.find((item) => item.id === id);
    if (activity) return activityScope(activity);
  }
  return "global";
}

/**
 * What the country filter shows: "mine" is my country plus global, "todos" is
 * everything, "global" is only global, and a country shows only that country.
 */
export type CountryFilter = "mine" | "todos" | "global" | CountryId;

export function parseCountryFilter(
  raw: string | null | undefined,
): CountryFilter {
  if (raw === "todos" || raw === "global") return raw;
  if (raw && isCountry(raw)) return raw;
  return "mine";
}

export function matchesCountryFilter(
  scope: Scope,
  filter: CountryFilter,
  mine: CountryId,
) {
  if (filter === "todos") return true;
  if (filter === "mine") return scope === "global" || scope === mine;
  return scope === filter;
}

/** Heads see everything unless they pick a country; everyone else sees theirs. */
export function resolveCountryFilter(
  raw: string | null | undefined,
  role: "admin" | "head" | "volunteer",
): CountryFilter {
  if (!raw) return role === "admin" ? "todos" : "mine";
  return parseCountryFilter(raw);
}

export function countryFilterOptions(mine: CountryId) {
  return [
    { id: "mine", label: `Mi país y global (${countryName(mine)})` },
    { id: "todos", label: "Todos los países" },
    { id: "global", label: "Solo global" },
    ...COUNTRIES.map((country) => ({ id: country.id, label: country.name })),
  ];
}
