import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const ZONE = "America/Costa_Rica";

export function formatCostaRica(
  date: Date | string,
  pattern = "d MMM yyyy, HH:mm",
) {
  const value = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(value, ZONE, pattern, { locale: es });
}

export function formatWhen(
  date: Date | string,
  timed: boolean | undefined,
  withTime: string,
  withoutTime: string,
) {
  return formatCostaRica(date, timed === false ? withoutTime : withTime);
}

export function clockLabel(date: string, timed: boolean | undefined) {
  if (timed === false) return "";
  return formatCostaRica(date, "HH:mm");
}

function noon(day: string) {
  return new Date(`${day}T18:00:00Z`);
}

export function shiftCostaRicaDay(day: string, days: number) {
  const date = noon(day);
  date.setUTCDate(date.getUTCDate() + days);
  return formatCostaRica(date, "yyyy-MM-dd");
}

export function shiftCostaRicaMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(
    Date.UTC(year ?? 2026, (monthNumber ?? 1) - 1 + delta, 1, 18),
  );
  return formatCostaRica(date, "yyyy-MM");
}

export function costaRicaMonthLength(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year ?? 2026, monthNumber ?? 1, 0)).getUTCDate();
}

export function costaRicaWeekStart(day: string) {
  const iso = Number(formatCostaRica(noon(day), "i"));
  return shiftCostaRicaDay(day, 1 - iso);
}
