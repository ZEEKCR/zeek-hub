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
