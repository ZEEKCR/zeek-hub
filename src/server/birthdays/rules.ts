export type Birthday = { month: number; day: number };

export type UpcomingBirthday = Birthday & {
  userId: string;
  name: string;
  daysUntil: number;
};

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Only month and day are kept: the year is never asked for or stored. */
export function validateBirthday(
  month: number,
  day: number,
): { ok: true; data: Birthday } | { ok: false; message: string } {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, message: "Escoge un mes." };
  }
  if (!Number.isInteger(day) || day < 1 || day > (MONTH_DAYS[month - 1] ?? 0)) {
    return { ok: false, message: "Ese día no existe en el mes escogido." };
  }
  return { ok: true, data: { month, day } };
}

export function birthdayLabel({ month, day }: Birthday) {
  return `${day} de ${MONTH_NAMES[month - 1] ?? ""}`;
}

function isLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayNumber(year: number, month: number, day: number) {
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * Days from `today` (yyyy-MM-dd) to the next occurrence of the birthday; 0 is
 * today. A 29 February birthday is celebrated on 28 February in common years.
 */
export function daysUntilBirthday(birthday: Birthday, today: string) {
  const [year = 1970, month = 1, day = 1] = today.split("-").map(Number);
  const base = dayNumber(year, month, day);
  const occurrence = (target: number) => {
    const feb29 = birthday.month === 2 && birthday.day === 29;
    const shifted = feb29 && !isLeap(target) ? 28 : birthday.day;
    return dayNumber(target, birthday.month, shifted);
  };
  const thisYear = occurrence(year);
  return (thisYear >= base ? thisYear : occurrence(year + 1)) - base;
}

export function upcomingBirthdays(
  people: { userId: string; name: string; month: number; day: number }[],
  today: string,
  windowDays: number,
): UpcomingBirthday[] {
  return people
    .map((person) => ({
      ...person,
      daysUntil: daysUntilBirthday(person, today),
    }))
    .filter((person) => person.daysUntil <= windowDays)
    .sort(
      (left, right) =>
        left.daysUntil - right.daysUntil ||
        left.name.localeCompare(right.name, "es"),
    );
}
