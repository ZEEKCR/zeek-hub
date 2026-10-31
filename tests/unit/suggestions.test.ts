import { beforeEach, describe, expect, it } from "vitest";
import { ensureMigrated, getDb } from "@/server/db/client";
import { eventSuggestions } from "@/server/db/schema";
import type { Actor, Role } from "@/server/domain/types";
import { validateSuggestion } from "@/server/suggestions/rules";
import {
  countNewSuggestions,
  createSuggestion,
  listOwnSuggestions,
  listSuggestions,
  setSuggestionStatus,
} from "@/server/services/suggestions";

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

const idea = {
  kind: "idea",
  title: "Ideathon de tecnología",
  description: "Un fin de semana para que jóvenes armen prototipos.",
  contactName: "",
  contactInfo: "",
  country: "sv",
};

describe("suggestion rules", () => {
  it("cleans a valid idea", () => {
    const result = validateSuggestion({ ...idea, title: "  Ideathon   X " });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe("Ideathon X");
      expect(result.data.contactName).toBeNull();
      expect(result.data.country).toBe("sv");
    }
  });

  it("asks for the person's name when it is a contact", () => {
    const missing = validateSuggestion({ ...idea, kind: "contacto" });
    expect(missing.ok).toBe(false);
    const good = validateSuggestion({
      ...idea,
      kind: "contacto",
      contactName: "Ana Ruiz",
      contactInfo: "ana@example.com",
    });
    expect(good.ok).toBe(true);
  });

  it("rejects bad kinds, short text and unknown countries", () => {
    for (const bad of [
      { ...idea, kind: "otro" },
      { ...idea, title: "ab" },
      { ...idea, description: "corto" },
      { ...idea, description: "x".repeat(2001) },
      { ...idea, country: "narnia" },
    ]) {
      expect(validateSuggestion(bad).ok).toBe(false);
    }
  });
});

describe("suggestions service", () => {
  beforeEach(async () => {
    await ensureMigrated();
    await getDb().delete(eventSuggestions);
  });

  it("lets anyone suggest and only Heads review", async () => {
    const volunteer = actor("volunteer", "vol-s");
    const head = actor("admin", "head-s");
    const created = await createSuggestion(volunteer, idea);
    expect(created.ok).toBe(true);
    expect(await listOwnSuggestions(volunteer)).toHaveLength(1);
    expect(await listOwnSuggestions(head)).toHaveLength(0);
    expect(await listSuggestions(volunteer, "all")).toEqual([]);
    expect(await countNewSuggestions(volunteer)).toBe(0);
    expect(await countNewSuggestions(head)).toBe(1);
    expect(await listSuggestions(head, "new")).toHaveLength(1);
  });

  it("lets a Head change the status and rejects others", async () => {
    const volunteer = actor("volunteer", "vol-t");
    const head = actor("admin", "head-t");
    const created = await createSuggestion(volunteer, idea);
    if (!created.ok) throw new Error("create failed");
    const denied = await setSuggestionStatus(
      volunteer,
      created.data.id,
      "accepted",
    );
    expect(denied.ok).toBe(false);
    expect((await setSuggestionStatus(head, created.data.id, "nope")).ok).toBe(
      false,
    );
    expect(
      (await setSuggestionStatus(head, created.data.id, "accepted")).ok,
    ).toBe(true);
    expect(await listSuggestions(head, "accepted")).toHaveLength(1);
    expect(await countNewSuggestions(head)).toBe(0);
    expect((await setSuggestionStatus(head, "missing", "accepted")).ok).toBe(
      false,
    );
  });
});
