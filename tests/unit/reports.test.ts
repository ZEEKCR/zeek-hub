import { beforeEach, describe, expect, it } from "vitest";
import { ensureMigrated, getDb } from "@/server/db/client";
import { reports } from "@/server/db/schema";
import type { Actor, Role } from "@/server/domain/types";
import { validateReport } from "@/server/reports/rules";
import {
  countOpenReports,
  createReport,
  listReports,
  setReportStatus,
} from "@/server/services/reports";

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

const good = {
  kind: "bug",
  subject: "No puedo mover una tarea",
  message: "Arrastro la tarjeta y vuelve a su columna.",
  screen: "Tareas",
  userAgent: "Test/1.0 · 1280x720",
};

describe("report rules", () => {
  it("cleans a valid report", () => {
    const result = validateReport({ ...good, subject: "  No  puedo   mover " });
    expect(result.ok && result.data.subject).toBe("No puedo mover");
  });

  it("rejects bad input and falls back to Otra for an unknown screen", () => {
    expect(validateReport({ ...good, kind: "x" }).ok).toBe(false);
    expect(validateReport({ ...good, subject: "ab" }).ok).toBe(false);
    expect(validateReport({ ...good, message: "corto" }).ok).toBe(false);
    expect(validateReport({ ...good, message: "x".repeat(2001) }).ok).toBe(
      false,
    );
    const result = validateReport({ ...good, screen: "Inventada" });
    expect(result.ok && result.data.screen).toBe("Otra");
  });
});

describe("reports", () => {
  beforeEach(async () => {
    await ensureMigrated();
    await getDb().delete(reports);
  });

  it("lets anyone send a report and only a Head read and resolve it", async () => {
    const created = await createReport(actor("volunteer", "ana"), good);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const head = actor("admin", "jefe");
    expect(await listReports(actor("volunteer", "ana"), "all")).toEqual([]);
    expect(await listReports(actor("head", "lead"), "all")).toEqual([]);
    const rows = await listReports(head, "open");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.reporterName).toBe("Persona ana");
    expect(await countOpenReports(head)).toBe(1);

    expect(
      (
        await setReportStatus(
          actor("volunteer", "ana"),
          created.data.id,
          "resolved",
        )
      ).ok,
    ).toBe(false);
    expect((await setReportStatus(head, created.data.id, "resolved")).ok).toBe(
      true,
    );
    expect(await countOpenReports(head)).toBe(0);
    expect(await listReports(head, "resolved")).toHaveLength(1);
    expect((await setReportStatus(head, created.data.id, "open")).ok).toBe(
      true,
    );
    expect((await setReportStatus(head, "no-existe", "resolved")).ok).toBe(
      false,
    );
  });

  it("limits how many reports one person can send in an hour", async () => {
    const person = actor("volunteer", "spam");
    for (let i = 0; i < 5; i += 1) {
      expect((await createReport(person, good)).ok).toBe(true);
    }
    const sixth = await createReport(person, good);
    expect(sixth.ok).toBe(false);
  });
});
