import { describe, expect, it } from "vitest";
import { authorize } from "@/server/auth/policy";
import type { Actor, Role } from "@/server/domain/types";
import { resourceProperties } from "@/server/repositories/notion/resources";
import {
  isHttpsUrl,
  parseTags,
  validateResourceInput,
  type ResourceInput,
} from "@/server/resources/rules";

const TEAMS = ["team-growth", "team-technical"];

function raw(extra: Partial<Record<string, string>> = {}) {
  return {
    title: "  Guía de   voluntariado ",
    url: "https://example.com/archivo.pdf",
    type: "Guía",
    teamId: "team-growth",
    tags: "Onboarding, onboarding , Eventos",
    visibility: "core",
    ...extra,
  };
}

function actor(role: Role): Actor {
  return {
    userId: role,
    volunteerId: null,
    username: role,
    displayName: role,
    role,
    teamIds: [],
    headOfTeamIds: [],
    banned: false,
    mustChangePassword: false,
    privacyAcceptedAt: null,
    tempPasswordExpiresAt: null,
  };
}

describe("resource rules", () => {
  it("cleans the input and keeps unique tags", () => {
    const result = validateResourceInput(raw(), TEAMS);
    expect(result).toEqual({
      ok: true,
      data: {
        title: "Guía de voluntariado",
        url: "https://example.com/archivo.pdf",
        type: "Guía",
        teamId: "team-growth",
        tags: ["Onboarding", "Eventos"],
        visibility: "core",
      },
    });
  });

  it("rejects what cannot be saved", () => {
    expect(validateResourceInput(raw({ title: "a" }), TEAMS).ok).toBe(false);
    expect(
      validateResourceInput(raw({ url: "http://x.com/a" }), TEAMS).ok,
    ).toBe(false);
    expect(
      validateResourceInput(raw({ url: "javascript:alert(1)" }), TEAMS).ok,
    ).toBe(false);
    expect(validateResourceInput(raw({ type: "Video" }), TEAMS).ok).toBe(false);
    expect(validateResourceInput(raw({ teamId: "team-x" }), TEAMS).ok).toBe(
      false,
    );
  });

  it("falls back to volunteer visibility", () => {
    const result = validateResourceInput(raw({ visibility: "otra" }), TEAMS);
    expect(result.ok && result.data.visibility).toBe("volunteers");
  });

  it("recognizes https links and caps the tags", () => {
    expect(isHttpsUrl("https://zeek.example/x")).toBe(true);
    expect(isHttpsUrl("ftp://zeek.example/x")).toBe(false);
    expect(
      parseTags(Array.from({ length: 20 }, (_, i) => `t${i}`).join(",")).length,
    ).toBe(10);
  });

  it("lets only a Head create resources", () => {
    expect(authorize(actor("admin"), "resources.create")).toBe(true);
    expect(authorize(actor("head"), "resources.create")).toBe(false);
    expect(authorize(actor("volunteer"), "resources.create")).toBe(false);
  });
});

describe("resource properties", () => {
  const input: ResourceInput = {
    title: "Guía",
    url: "https://example.com/a.pdf",
    type: "Guía",
    teamId: "team-operations",
    tags: ["Eventos"],
    visibility: "core",
  };

  it("writes every column in the type the database has", () => {
    const properties = resourceProperties(
      input,
      {
        type: "select",
        team: "select",
        tags: "multi_select",
        visibility: "select",
      },
      { name: "Operations" },
    );
    expect(properties["URL"]).toEqual({ url: "https://example.com/a.pdf" });
    expect(properties["Tipo"]).toEqual({ select: { name: "Guía" } });
    expect(properties["Equipo"]).toEqual({ select: { name: "Ops" } });
    expect(properties["Etiquetas"]).toEqual({
      multi_select: [{ name: "Eventos" }],
    });
    expect(properties["Visibilidad"]).toEqual({ select: { name: "Núcleo" } });
  });

  it("uses the Notion team page for a relation and skips missing columns", () => {
    const withTeam = resourceProperties(
      input,
      { type: null, team: "relation", tags: null, visibility: null },
      { name: "Operations", pageId: "page-1" },
    );
    expect(withTeam["Equipo"]).toEqual({ relation: [{ id: "page-1" }] });
    expect(withTeam["Tipo"]).toBeUndefined();
    expect(withTeam["Etiquetas"]).toBeUndefined();
    const withoutTeam = resourceProperties(
      input,
      { type: null, team: "relation", tags: null, visibility: null },
      { name: "Operations" },
    );
    expect(withoutTeam["Equipo"]).toBeUndefined();
  });
});
