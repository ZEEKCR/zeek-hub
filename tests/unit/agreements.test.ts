import { beforeEach, describe, expect, it } from "vitest";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user, volunteerAgreements } from "@/server/db/schema";
import type { Actor, Role } from "@/server/domain/types";
import {
  MAX_AGREEMENT_BYTES,
  cleanFilename,
  formatSize,
  validateAgreement,
} from "@/server/agreements/rules";
import {
  getAgreementMeta,
  listAgreementStatus,
  readAgreement,
  removeAgreement,
  saveAgreement,
} from "@/server/services/agreements";

function actor(role: Role, userId: string): Actor {
  return {
    userId,
    volunteerId: null,
    username: userId,
    displayName: userId,
    role,
    teamIds: [],
    headOfTeamIds: [],
    banned: false,
    mustChangePassword: false,
    privacyAcceptedAt: null,
    tempPasswordExpiresAt: null,
  };
}

const pdf = (extra = 10) =>
  new Uint8Array([
    ...new TextEncoder().encode("%PDF-1.7\n"),
    ...new Uint8Array(extra),
  ]);

describe("agreement rules", () => {
  it("accepts a PDF and rejects other files by content, not by name", () => {
    expect(validateAgreement(pdf()).ok).toBe(true);
    expect(validateAgreement(new Uint8Array()).ok).toBe(false);
    expect(
      validateAgreement(new TextEncoder().encode("<html>no</html>")).ok,
    ).toBe(false);
    expect(validateAgreement(new Uint8Array([0x50, 0x4b, 3, 4])).ok).toBe(
      false,
    );
  });

  it("rejects files over 4 MB", () => {
    expect(validateAgreement(pdf(MAX_AGREEMENT_BYTES)).ok).toBe(false);
  });

  it("cleans file names", () => {
    expect(cleanFilename("C:\\Users\\Abdiel\\Acuerdo Firmado.PDF")).toBe(
      "Acuerdo_Firmado.pdf",
    );
    expect(cleanFilename("../../etc/passwd")).toBe("passwd.pdf");
    expect(cleanFilename("Acuerdo_Voluntariado_José_Núñez.docx.pdf")).toBe(
      "Acuerdo_Voluntariado_Jose_Nunez.docx.pdf",
    );
    expect(cleanFilename("???.pdf")).toBe("acuerdo.pdf");
    expect(cleanFilename("x".repeat(200)).length).toBeLessThanOrEqual(84);
  });

  it("formats sizes", () => {
    expect(formatSize(287_600)).toBe("288 KB");
    expect(formatSize(2_500_000)).toBe("2.5 MB");
  });
});

describe("agreements", () => {
  beforeEach(async () => {
    await ensureMigrated();
    const db = getDb();
    await db.delete(volunteerAgreements);
    await db.delete(user);
    const now = new Date();
    await db.insert(user).values(
      ["ana", "luis", "jefe"].map((id) => ({
        id,
        name: id === "jefe" ? "Jefa" : id === "ana" ? "Ana" : "Luis",
        email: `${id}@example.com`,
        username: id,
        createdAt: now,
        updatedAt: now,
      })),
    );
  });

  it("lets a person upload their own and replace it", async () => {
    const ana = actor("volunteer", "ana");
    expect((await saveAgreement(ana, "ana", "uno.pdf", pdf(5))).ok).toBe(true);
    expect((await saveAgreement(ana, "ana", "dos.pdf", pdf(50))).ok).toBe(true);
    const meta = await getAgreementMeta("ana");
    expect(meta?.filename).toBe("dos.pdf");
    expect(meta?.size).toBe(pdf(50).length);
  });

  it("does not let a volunteer or a Lead upload for someone else", async () => {
    expect(
      (await saveAgreement(actor("volunteer", "ana"), "luis", "x.pdf", pdf()))
        .ok,
    ).toBe(false);
    expect(
      (await saveAgreement(actor("head", "lead"), "luis", "x.pdf", pdf())).ok,
    ).toBe(false);
    expect(await getAgreementMeta("luis")).toBeNull();
  });

  it("lets a Head upload on someone's behalf, and the person can then read it", async () => {
    const result = await saveAgreement(
      actor("admin", "jefe"),
      "luis",
      "luis.pdf",
      pdf(),
    );
    expect(result.ok).toBe(true);
    expect((await getAgreementMeta("luis"))?.uploadedBy).toBe("jefe");
    const own = await readAgreement(actor("volunteer", "luis"), "luis");
    expect(own?.filename).toBe("luis.pdf");
    expect(String.fromCharCode(...(own?.bytes.slice(0, 5) ?? []))).toBe(
      "%PDF-",
    );
  });

  it("keeps agreements private: only the owner and Heads can read them", async () => {
    await saveAgreement(actor("volunteer", "ana"), "ana", "ana.pdf", pdf());
    expect(await readAgreement(actor("volunteer", "luis"), "ana")).toBeNull();
    expect(await readAgreement(actor("head", "lead"), "ana")).toBeNull();
    expect(await readAgreement(actor("admin", "jefe"), "ana")).not.toBeNull();
  });

  it("refuses bad files and unknown accounts", async () => {
    const ana = actor("volunteer", "ana");
    expect(
      (
        await saveAgreement(
          ana,
          "ana",
          "x.pdf",
          new TextEncoder().encode("hola"),
        )
      ).ok,
    ).toBe(false);
    expect(
      (await saveAgreement(actor("admin", "jefe"), "nadie", "x.pdf", pdf())).ok,
    ).toBe(false);
  });

  it("shows the dashboard to Heads only, without loading the files", async () => {
    await saveAgreement(actor("volunteer", "ana"), "ana", "ana.pdf", pdf());
    expect(await listAgreementStatus(actor("volunteer", "ana"))).toEqual([]);
    expect(await listAgreementStatus(actor("head", "lead"))).toEqual([]);
    const rows = await listAgreementStatus(actor("admin", "jefe"));
    expect(rows.map((row) => [row.name, row.agreement !== null])).toEqual([
      ["Ana", true],
      ["Jefa", false],
      ["Luis", false],
    ]);
    expect(JSON.stringify(rows)).not.toContain("JVBER");
  });

  it("lets only a Head remove an agreement", async () => {
    await saveAgreement(actor("volunteer", "ana"), "ana", "ana.pdf", pdf());
    expect((await removeAgreement(actor("volunteer", "ana"), "ana")).ok).toBe(
      false,
    );
    expect(await getAgreementMeta("ana")).not.toBeNull();
    expect((await removeAgreement(actor("admin", "jefe"), "ana")).ok).toBe(
      true,
    );
    expect(await getAgreementMeta("ana")).toBeNull();
  });
});
