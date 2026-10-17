import { formatCostaRica } from "@/lib/dates";

/** Time-of-day greeting in Costa Rica time. */
export function greeting(now: Date) {
  const hour = Number(formatCostaRica(now, "H"));
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full;
}
