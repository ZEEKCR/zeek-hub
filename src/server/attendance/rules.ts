export type Rsvp = "going" | "not_going";

export type ShiftInput = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
};

export const MAX_SHIFT_CAPACITY = 500;
const MAX_SHIFT_MS = 24 * 3_600_000;
/** Costa Rica has no daylight saving time, so its offset is fixed. */
const COSTA_RICA_OFFSET = "-06:00";

export function isRsvp(value: string): value is Rsvp {
  return value === "going" || value === "not_going";
}

function parseLocal(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${COSTA_RICA_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Start and end arrive as `yyyy-MM-ddTHH:mm` in Costa Rica time. */
export function validateShift(raw: {
  title: string;
  start: string;
  end: string;
  capacity: string;
}): { ok: true; data: ShiftInput } | { ok: false; message: string } {
  const title = raw.title.trim();
  if (title.length < 2 || title.length > 80) {
    return {
      ok: false,
      message: "El turno necesita un nombre de 2 a 80 letras.",
    };
  }
  const startsAt = parseLocal(raw.start);
  const endsAt = parseLocal(raw.end);
  if (!startsAt || !endsAt) {
    return {
      ok: false,
      message: "Indica la hora de inicio y de fin del turno.",
    };
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    return { ok: false, message: "El turno debe terminar después de empezar." };
  }
  if (endsAt.getTime() - startsAt.getTime() > MAX_SHIFT_MS) {
    return { ok: false, message: "Un turno no puede durar más de 24 horas." };
  }
  const capacity = Number(raw.capacity);
  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > MAX_SHIFT_CAPACITY
  ) {
    return {
      ok: false,
      message: `El cupo debe ser un número entre 1 y ${MAX_SHIFT_CAPACITY}.`,
    };
  }
  return { ok: true, data: { title, startsAt, endsAt, capacity } };
}

export function shiftHours(startsAt: Date, endsAt: Date) {
  return (
    Math.round(((endsAt.getTime() - startsAt.getTime()) / 3_600_000) * 100) /
    100
  );
}

/**
 * Spreadsheet apps run text that starts with = + - @ as a formula, so those
 * cells get a leading apostrophe. Names and task titles are user-typed.
 */
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** UTF-8 with a BOM so Excel reads the accents correctly. */
export function toCsv(rows: (string | number)[][]) {
  return `﻿${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

/** Hours of shifts that already ended; a shift in progress or ahead does not count yet. */
export function completedShiftHours(
  shifts: { startsAt: Date; endsAt: Date }[],
  now: Date,
) {
  return shifts
    .filter((shift) => shift.endsAt.getTime() <= now.getTime())
    .reduce(
      (total, shift) => total + shiftHours(shift.startsAt, shift.endsAt),
      0,
    );
}

/** Events the person said "voy" to whose day has already passed. */
export function attendedEvents(
  goingActivityIds: string[],
  eventDay: Map<string, string>,
  today: string,
) {
  return new Set(
    goingActivityIds.filter((id) => {
      const day = eventDay.get(id);
      return day !== undefined && day < today;
    }),
  ).size;
}
