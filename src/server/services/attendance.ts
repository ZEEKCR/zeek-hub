import { and, asc, eq, inArray } from "drizzle-orm";
import { writeAudit } from "@/server/audit/log";
import { authorize } from "@/server/auth/policy";
import { ensureMigrated, getDb } from "@/server/db/client";
import {
  eventRsvps,
  eventShifts,
  shiftSignups,
  user,
} from "@/server/db/schema";
import { err, ok, type Result } from "@/server/domain/result";
import type { Actor } from "@/server/domain/types";
import {
  isRsvp,
  shiftHours,
  validateShift,
  type Rsvp,
} from "@/server/attendance/rules";

export type ShiftView = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  signedUp: number;
  mine: boolean;
  /** Names are only filled in for leads. */
  people: string[];
};

export type AttendanceView = {
  mine: Rsvp | null;
  going: number;
  notGoing: number;
  goingNames: string[];
  shifts: ShiftView[];
};

async function audit(
  actor: Actor,
  action: string,
  entityId: string,
  after: Record<string, unknown>,
) {
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action,
    entity: "event",
    entityId,
    after,
  });
}

export async function setRsvp(
  actor: Actor,
  activityId: string,
  status: string | null,
): Promise<Result<Rsvp | null>> {
  if (!authorize(actor, "events.rsvp")) {
    return err("forbidden", "No tiene permiso para confirmar asistencia.");
  }
  if (status !== null && !isRsvp(status)) {
    return err("validation", "La respuesta no es válida.");
  }
  await ensureMigrated();
  const db = getDb();
  if (status === null) {
    await db
      .delete(eventRsvps)
      .where(
        and(
          eq(eventRsvps.activityId, activityId),
          eq(eventRsvps.userId, actor.userId),
        ),
      );
  } else {
    const now = new Date();
    await db
      .insert(eventRsvps)
      .values({ activityId, userId: actor.userId, status, updatedAt: now })
      .onConflictDoUpdate({
        target: [eventRsvps.activityId, eventRsvps.userId],
        set: { status, updatedAt: now },
      });
  }
  await audit(actor, "event.rsvp", activityId, { status });
  return ok(status);
}

export async function createShift(
  actor: Actor,
  activityId: string,
  raw: Parameters<typeof validateShift>[0],
): Promise<Result<{ id: string }>> {
  if (!authorize(actor, "events.manage")) {
    return err("forbidden", "Solo un Head o un Lead puede crear turnos.");
  }
  const parsed = validateShift(raw);
  if (!parsed.ok) return err("validation", parsed.message);
  await ensureMigrated();
  const id = crypto.randomUUID();
  await getDb().insert(eventShifts).values({
    id,
    activityId,
    title: parsed.data.title,
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
    capacity: parsed.data.capacity,
    createdBy: actor.userId,
    createdAt: new Date(),
  });
  await audit(actor, "shift.create", activityId, {
    shiftId: id,
    capacity: parsed.data.capacity,
  });
  return ok({ id });
}

export async function deleteShift(
  actor: Actor,
  shiftId: string,
): Promise<Result<null>> {
  if (!authorize(actor, "events.manage")) {
    return err("forbidden", "Solo un Head o un Lead puede borrar turnos.");
  }
  await ensureMigrated();
  const db = getDb();
  const [shift] = await db
    .select()
    .from(eventShifts)
    .where(eq(eventShifts.id, shiftId));
  if (!shift) return err("not_found", "El turno ya no existe.");
  await db.transaction(async (tx) => {
    await tx.delete(shiftSignups).where(eq(shiftSignups.shiftId, shiftId));
    await tx.delete(eventShifts).where(eq(eventShifts.id, shiftId));
  });
  await audit(actor, "shift.delete", shift.activityId, { shiftId });
  return ok(null);
}

/** The shift row is locked while counting, so two people cannot take the last spot. */
export async function joinShift(
  actor: Actor,
  shiftId: string,
): Promise<Result<null>> {
  if (!authorize(actor, "events.rsvp")) {
    return err("forbidden", "No tiene permiso para apuntarse a turnos.");
  }
  await ensureMigrated();
  const outcome = await getDb().transaction(async (tx) => {
    const [shift] = await tx
      .select()
      .from(eventShifts)
      .where(eq(eventShifts.id, shiftId))
      .for("update");
    if (!shift) return { kind: "missing" as const };
    const taken = await tx
      .select({ userId: shiftSignups.userId })
      .from(shiftSignups)
      .where(eq(shiftSignups.shiftId, shiftId));
    if (taken.some((row) => row.userId === actor.userId)) {
      return { kind: "joined" as const, activityId: shift.activityId };
    }
    if (taken.length >= shift.capacity) return { kind: "full" as const };
    await tx
      .insert(shiftSignups)
      .values({ shiftId, userId: actor.userId, createdAt: new Date() });
    return { kind: "joined" as const, activityId: shift.activityId };
  });
  if (outcome.kind === "missing") {
    return err("not_found", "El turno ya no existe.");
  }
  if (outcome.kind === "full") {
    return err("conflict", "Ese turno ya está lleno.");
  }
  await audit(actor, "shift.join", outcome.activityId, { shiftId });
  return ok(null);
}

export async function leaveShift(
  actor: Actor,
  shiftId: string,
): Promise<Result<null>> {
  if (!authorize(actor, "events.rsvp")) {
    return err("forbidden", "No tiene permiso para cambiar turnos.");
  }
  await ensureMigrated();
  await getDb()
    .delete(shiftSignups)
    .where(
      and(
        eq(shiftSignups.shiftId, shiftId),
        eq(shiftSignups.userId, actor.userId),
      ),
    );
  return ok(null);
}

export async function loadAttendance(
  actor: Actor,
  activityId: string,
): Promise<AttendanceView> {
  await ensureMigrated();
  const db = getDb();
  const lead = authorize(actor, "events.manage");
  const rsvps = await db
    .select({
      userId: eventRsvps.userId,
      status: eventRsvps.status,
      name: user.name,
    })
    .from(eventRsvps)
    .leftJoin(user, eq(user.id, eventRsvps.userId))
    .where(eq(eventRsvps.activityId, activityId));
  const shifts = await db
    .select()
    .from(eventShifts)
    .where(eq(eventShifts.activityId, activityId))
    .orderBy(asc(eventShifts.startsAt));
  const signups = shifts.length
    ? await db
        .select({
          shiftId: shiftSignups.shiftId,
          userId: shiftSignups.userId,
          name: user.name,
        })
        .from(shiftSignups)
        .leftJoin(user, eq(user.id, shiftSignups.userId))
        .where(
          inArray(
            shiftSignups.shiftId,
            shifts.map((shift) => shift.id),
          ),
        )
    : [];
  const going = rsvps.filter((row) => row.status === "going");
  return {
    mine:
      (rsvps.find((row) => row.userId === actor.userId)?.status as
        Rsvp | undefined) ?? null,
    going: going.length,
    notGoing: rsvps.length - going.length,
    goingNames: going
      .map((row) => row.name ?? "")
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, "es")),
    shifts: shifts.map((shift) => {
      const rows = signups.filter((row) => row.shiftId === shift.id);
      return {
        id: shift.id,
        title: shift.title,
        startsAt: shift.startsAt,
        endsAt: shift.endsAt,
        capacity: shift.capacity,
        signedUp: rows.length,
        mine: rows.some((row) => row.userId === actor.userId),
        people: lead
          ? rows
              .map((row) => row.name ?? "")
              .filter(Boolean)
              .sort((left, right) => left.localeCompare(right, "es"))
          : [],
      };
    }),
  };
}

export type ReportTask = { title: string; status: string; assignees: string[] };

/** Rows for the CSV a lead downloads when closing an event. */
export async function buildEventReport(
  actor: Actor,
  activityId: string,
  pendingTasks: ReportTask[],
): Promise<Result<(string | number)[][]>> {
  if (!authorize(actor, "events.manage")) {
    return err(
      "forbidden",
      "Solo un Head o un Lead puede descargar el reporte.",
    );
  }
  await ensureMigrated();
  const db = getDb();
  const rsvps = await db
    .select({ status: eventRsvps.status, name: user.name })
    .from(eventRsvps)
    .leftJoin(user, eq(user.id, eventRsvps.userId))
    .where(eq(eventRsvps.activityId, activityId));
  const shifts = await db
    .select()
    .from(eventShifts)
    .where(eq(eventShifts.activityId, activityId))
    .orderBy(asc(eventShifts.startsAt));
  const signups = shifts.length
    ? await db
        .select({ shiftId: shiftSignups.shiftId, name: user.name })
        .from(shiftSignups)
        .leftJoin(user, eq(user.id, shiftSignups.userId))
        .where(
          inArray(
            shiftSignups.shiftId,
            shifts.map((shift) => shift.id),
          ),
        )
    : [];
  const rows: (string | number)[][] = [
    ["Tipo", "Nombre", "Detalle", "Estado", "Horas de turno"],
  ];
  for (const row of [...rsvps].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", "es"),
  )) {
    rows.push([
      "Asistencia",
      row.name ?? "",
      "",
      row.status === "going" ? "Va" : "No va",
      "",
    ]);
  }
  for (const shift of shifts) {
    const hours = shiftHours(shift.startsAt, shift.endsAt);
    const people = signups.filter((row) => row.shiftId === shift.id);
    rows.push([
      "Turno",
      shift.title,
      `Cupo ${shift.capacity}`,
      `${people.length} de ${shift.capacity}`,
      hours,
    ]);
    for (const person of people) {
      rows.push([
        "Turno inscrito",
        person.name ?? "",
        shift.title,
        "Inscrito",
        hours,
      ]);
    }
  }
  for (const task of pendingTasks) {
    rows.push([
      "Tarea pendiente",
      task.title,
      task.assignees.join("; "),
      task.status,
      "",
    ]);
  }
  await audit(actor, "event.report", activityId, { rows: rows.length - 1 });
  return ok(rows);
}

/** Shifts the person signed up for that start inside the window, for "Mi semana". */
export async function listMyShifts(actor: Actor, from: Date, to: Date) {
  await ensureMigrated();
  const db = getDb();
  const mine = await db
    .select({ shiftId: shiftSignups.shiftId })
    .from(shiftSignups)
    .where(eq(shiftSignups.userId, actor.userId));
  if (mine.length === 0) return [];
  const shifts = await db
    .select()
    .from(eventShifts)
    .where(
      inArray(
        eventShifts.id,
        mine.map((row) => row.shiftId),
      ),
    )
    .orderBy(asc(eventShifts.startsAt));
  return shifts.filter(
    (shift) =>
      shift.endsAt.getTime() >= from.getTime() &&
      shift.startsAt.getTime() <= to.getTime(),
  );
}
