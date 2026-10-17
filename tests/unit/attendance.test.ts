import { beforeEach, describe, expect, it } from "vitest";
import { ensureMigrated, getDb } from "@/server/db/client";
import { eventRsvps, eventShifts, shiftSignups } from "@/server/db/schema";
import type { Actor, Role } from "@/server/domain/types";
import {
  csvCell,
  shiftHours,
  toCsv,
  validateShift,
} from "@/server/attendance/rules";
import {
  buildEventReport,
  createShift,
  deleteShift,
  joinShift,
  leaveShift,
  loadAttendance,
  setRsvp,
} from "@/server/services/attendance";

function actor(role: Role, userId: string): Actor {
  return {
    userId,
    volunteerId: null,
    username: userId,
    displayName: userId,
    fullName: `Persona ${userId}`,
    role,
    teamIds: [],
    headOfTeamIds: [],
    banned: false,
    mustChangePassword: false,
    privacyAcceptedAt: null,
    tempPasswordExpiresAt: null,
  };
}

const shiftForm = {
  title: "Registro",
  start: "2026-11-20T08:00",
  end: "2026-11-20T12:30",
  capacity: "2",
};

describe("shift rules", () => {
  it("reads times as Costa Rica time and counts hours", () => {
    const result = validateShift(shiftForm);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.startsAt.toISOString()).toBe("2026-11-20T14:00:00.000Z");
    expect(shiftHours(result.data.startsAt, result.data.endsAt)).toBe(4.5);
  });

  it("rejects bad shifts", () => {
    expect(validateShift({ ...shiftForm, title: "a" }).ok).toBe(false);
    expect(validateShift({ ...shiftForm, end: "2026-11-20T08:00" }).ok).toBe(
      false,
    );
    expect(validateShift({ ...shiftForm, end: "2026-11-22T08:00" }).ok).toBe(
      false,
    );
    expect(validateShift({ ...shiftForm, start: "mañana" }).ok).toBe(false);
    expect(validateShift({ ...shiftForm, capacity: "0" }).ok).toBe(false);
    expect(validateShift({ ...shiftForm, capacity: "1.5" }).ok).toBe(false);
    expect(validateShift({ ...shiftForm, capacity: "501" }).ok).toBe(false);
  });
});

describe("csv", () => {
  it("quotes commas and quotes", () => {
    expect(csvCell('Ana, "la" jefa')).toBe('"Ana, ""la"" jefa"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@x")).toBe("'@x");
  });

  it("starts with a BOM and ends rows with CRLF", () => {
    const csv = toCsv([["a", 1]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.endsWith("a,1\r\n")).toBe(true);
  });
});

describe("attendance", () => {
  beforeEach(async () => {
    await ensureMigrated();
    const db = getDb();
    await db.delete(shiftSignups);
    await db.delete(eventShifts);
    await db.delete(eventRsvps);
  });

  it("keeps one answer per person and lets them change or clear it", async () => {
    const ana = actor("volunteer", "ana");
    await setRsvp(ana, "ev1", "going");
    await setRsvp(ana, "ev1", "not_going");
    await setRsvp(actor("volunteer", "luis"), "ev1", "going");
    const view = await loadAttendance(ana, "ev1");
    expect(view.mine).toBe("not_going");
    expect(view.going).toBe(1);
    expect(view.notGoing).toBe(1);
    await setRsvp(ana, "ev1", null);
    expect((await loadAttendance(ana, "ev1")).mine).toBeNull();
    expect((await setRsvp(ana, "ev1", "maybe")).ok).toBe(false);
  });

  it("lets only leads and heads create and delete shifts", async () => {
    const created = await createShift(
      actor("volunteer", "ana"),
      "ev1",
      shiftForm,
    );
    expect(created.ok).toBe(false);
    const made = await createShift(actor("head", "lead"), "ev1", shiftForm);
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    expect(
      (await deleteShift(actor("volunteer", "ana"), made.data.id)).ok,
    ).toBe(false);
    expect((await deleteShift(actor("admin", "jefe"), made.data.id)).ok).toBe(
      true,
    );
    expect(
      (await loadAttendance(actor("admin", "jefe"), "ev1")).shifts,
    ).toHaveLength(0);
  });

  it("stops at the capacity and frees a spot when someone leaves", async () => {
    const made = await createShift(actor("admin", "jefe"), "ev1", shiftForm);
    if (!made.ok) throw new Error("setup failed");
    const id = made.data.id;
    expect((await joinShift(actor("volunteer", "a"), id)).ok).toBe(true);
    expect((await joinShift(actor("volunteer", "a"), id)).ok).toBe(true);
    expect((await joinShift(actor("volunteer", "b"), id)).ok).toBe(true);
    const full = await joinShift(actor("volunteer", "c"), id);
    expect(full.ok).toBe(false);
    await leaveShift(actor("volunteer", "a"), id);
    expect((await joinShift(actor("volunteer", "c"), id)).ok).toBe(true);
    const view = await loadAttendance(actor("volunteer", "c"), "ev1");
    expect(view.shifts[0]?.signedUp).toBe(2);
    expect(view.shifts[0]?.mine).toBe(true);
  });

  it("does not oversell when people join at the same time", async () => {
    const made = await createShift(actor("admin", "jefe"), "ev1", {
      ...shiftForm,
      capacity: "3",
    });
    if (!made.ok) throw new Error("setup failed");
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        joinShift(actor("volunteer", `p${index}`), made.data.id),
      ),
    );
    expect(results.filter((result) => result.ok)).toHaveLength(3);
    const view = await loadAttendance(actor("admin", "jefe"), "ev1");
    expect(view.shifts[0]?.signedUp).toBe(3);
  });

  it("shows who signed up only to leads", async () => {
    const made = await createShift(actor("admin", "jefe"), "ev1", shiftForm);
    if (!made.ok) throw new Error("setup failed");
    await joinShift(actor("volunteer", "a"), made.data.id);
    const asVolunteer = await loadAttendance(actor("volunteer", "a"), "ev1");
    expect(asVolunteer.shifts[0]?.people).toEqual([]);
    const asLead = await loadAttendance(actor("head", "lead"), "ev1");
    expect(asLead.shifts[0]?.signedUp).toBe(1);
  });

  it("builds the report for leads only, with pending tasks", async () => {
    await setRsvp(actor("volunteer", "ana"), "ev1", "going");
    const made = await createShift(actor("admin", "jefe"), "ev1", shiftForm);
    if (!made.ok) throw new Error("setup failed");
    await joinShift(actor("volunteer", "ana"), made.data.id);
    const tasks = [
      { title: "=Comprar", status: "Por hacer", assignees: ["Ana"] },
    ];
    expect(
      (await buildEventReport(actor("volunteer", "ana"), "ev1", tasks)).ok,
    ).toBe(false);
    const report = await buildEventReport(actor("head", "lead"), "ev1", tasks);
    expect(report.ok).toBe(true);
    if (!report.ok) return;
    const kinds = report.data.map((row) => row[0]);
    expect(kinds).toEqual([
      "Tipo",
      "Asistencia",
      "Turno",
      "Turno inscrito",
      "Tarea pendiente",
    ]);
    expect(report.data[2]?.[4]).toBe(4.5);
    expect(toCsv(report.data)).toContain("'=Comprar");
  });
});
