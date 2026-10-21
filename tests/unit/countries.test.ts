import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { badgeCaption } from "@/lib/badge";
import { flagRects } from "@/lib/flags";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import {
  activityScope,
  matchesCountryFilter,
  parseCountry,
  parseCountryFilter,
  parseScope,
  resolveCountryFilter,
  taskScope,
} from "@/server/domain/countries";
import type { Actor } from "@/server/domain/types";
import { resetMemoryStore } from "@/server/repositories/memory/store";
import { mapActivityPage } from "@/server/repositories/notion/mappers";
import { activityProperties } from "@/server/repositories/notion/write";
import {
  buildActor,
  provisionUser,
  updateAccountProfile,
} from "@/server/services/users";

describe("country parsing", () => {
  it("reads ids and names without caring for accents or case", () => {
    expect(parseCountry("cr")).toBe("cr");
    expect(parseCountry("México")).toBe("mx");
    expect(parseCountry("mexico")).toBe("mx");
    expect(parseCountry(" EL SALVADOR ")).toBe("sv");
    expect(parseCountry("Colombia")).toBe("co");
    expect(parseCountry("Chile")).toBeNull();
    expect(parseCountry(undefined)).toBeNull();
    expect(parseScope("Global")).toBe("global");
    expect(parseScope("")).toBeNull();
  });
});

describe("scopes and filters", () => {
  const activities = [
    { id: "a-sv", country: "sv" as const },
    { id: "a-g", country: "global" as const },
    { id: "a-none" },
  ];

  it("treats an untagged event as Costa Rica", () => {
    expect(activityScope({})).toBe("cr");
    expect(activityScope({ country: "co" })).toBe("co");
  });

  it("gives a task the scope of its event, or global with none", () => {
    expect(taskScope({ activityIds: ["a-sv"] }, activities)).toBe("sv");
    expect(taskScope({ activityIds: ["a-none"] }, activities)).toBe("cr");
    expect(taskScope({ activityIds: [] }, activities)).toBe("global");
    expect(taskScope({ activityIds: ["x", "a-g"] }, activities)).toBe("global");
  });

  it("filters by my country, everything, global or one country", () => {
    expect(matchesCountryFilter("sv", "mine", "sv")).toBe(true);
    expect(matchesCountryFilter("global", "mine", "sv")).toBe(true);
    expect(matchesCountryFilter("cr", "mine", "sv")).toBe(false);
    expect(matchesCountryFilter("cr", "todos", "sv")).toBe(true);
    expect(matchesCountryFilter("sv", "global", "sv")).toBe(false);
    expect(matchesCountryFilter("global", "global", "sv")).toBe(true);
    expect(matchesCountryFilter("mx", "mx", "sv")).toBe(true);
    expect(matchesCountryFilter("global", "mx", "sv")).toBe(false);
  });

  it("defaults to my country, and to everything for Heads", () => {
    expect(resolveCountryFilter(undefined, "volunteer")).toBe("mine");
    expect(resolveCountryFilter(undefined, "head")).toBe("mine");
    expect(resolveCountryFilter(undefined, "admin")).toBe("todos");
    expect(resolveCountryFilter("co", "admin")).toBe("co");
    expect(parseCountryFilter("nonsense")).toBe("mine");
  });
});

describe("notion país column", () => {
  it("reads the select into the activity", () => {
    const mapped = mapActivityPage({
      id: "e1",
      properties: {
        Activity: { type: "title", title: [{ plain_text: "Feria" }] },
        País: { type: "select", select: { name: "El Salvador" } },
      },
    });
    expect(mapped?.activity.country).toBe("sv");
    const global = mapActivityPage({
      id: "e2",
      properties: {
        Activity: { type: "title", title: [{ plain_text: "Charla" }] },
        País: { type: "select", select: { name: "Global" } },
      },
    });
    expect(global?.activity.country).toBe("global");
    const none = mapActivityPage({
      id: "e3",
      properties: {
        Activity: { type: "title", title: [{ plain_text: "Otra" }] },
      },
    });
    expect(none?.activity.country).toBeUndefined();
  });

  it("writes the option name, and leaves the column alone without a country", () => {
    const base = { title: "Feria", stage: "idea" as const, type: "Event" };
    expect(activityProperties({ ...base, country: "mx" })["País"]).toEqual({
      select: { name: "México" },
    });
    expect(activityProperties({ ...base, country: "global" })["País"]).toEqual({
      select: { name: "Global" },
    });
    expect("País" in activityProperties(base)).toBe(false);
  });
});

describe("flags and badge caption", () => {
  it("draws every flag from rectangles inside its box", () => {
    for (const id of ["cr", "mx", "sv", "co"] as const) {
      const rects = flagRects(id, 60, 40);
      expect(rects.length).toBeGreaterThan(1);
      for (const rect of rects) {
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(60.001);
        expect(rect.y + rect.height).toBeLessThanOrEqual(40.001);
      }
    }
  });

  it("adds the flag to the caption when the country is known", () => {
    expect(badgeCaption("red", { country: "sv" })).toBe(
      "Soy parte de la red de ZEEK. 🇸🇻 The Future Is Built Together. #ZEEK #Voluntariado",
    );
  });
});

describe("user country", () => {
  beforeEach(async () => {
    resetMemoryStore();
    await ensureMigrated();
    await getDb().delete(user);
  });

  function head(userId: string): Actor {
    return {
      userId,
      volunteerId: null,
      username: userId,
      displayName: userId,
      role: "admin",
      teamIds: [],
      headOfTeamIds: [],
      banned: false,
      mustChangePassword: false,
      privacyAcceptedAt: "2026-10-14T00:00:00.000Z",
      tempPasswordExpiresAt: null,
    };
  }

  it("defaults to Costa Rica, can be set on creation and edited by a Head", async () => {
    const boss = await provisionUser({
      username: "jefa",
      name: "Jefa",
      role: "admin",
      primaryTeamId: "team-growth",
      createdBy: null,
    });
    const rica = await provisionUser({
      username: "tica",
      name: "Tica",
      role: "volunteer",
      primaryTeamId: "team-growth",
      createdBy: null,
    });
    const sal = await provisionUser({
      username: "salva",
      name: "Salva",
      role: "volunteer",
      primaryTeamId: "team-growth",
      country: "sv",
      createdBy: null,
    });
    if (!boss.ok || !rica.ok || !sal.ok) throw new Error("provision failed");
    expect((await buildActor(rica.data.userId))?.country).toBe("cr");
    expect((await buildActor(sal.data.userId))?.country).toBe("sv");

    const profile = {
      teamId: "team-growth",
      jobTitle: "",
      email: "",
      phone: "",
    };
    const changed = await updateAccountProfile(
      head(boss.data.userId),
      rica.data.userId,
      { ...profile, country: "México" },
    );
    expect(changed.ok).toBe(true);
    const [row] = await getDb()
      .select()
      .from(user)
      .where(eq(user.id, rica.data.userId));
    expect(row?.country).toBe("mx");
    const bad = await updateAccountProfile(
      head(boss.data.userId),
      rica.data.userId,
      { ...profile, country: "Narnia" },
    );
    expect(bad.ok).toBe(false);
  });
});
