import { describe, expect, it } from "vitest";
import { teamTone, teamToneOrFallback } from "@/lib/team-colors";
import { initials } from "@/lib/utils";

describe("teamTone", () => {
  it("matches a team by id or by name", () => {
    expect(teamTone("team-growth")).toEqual(teamTone("Growth"));
    expect(teamTone("team-operations")).toEqual(teamTone(" operations "));
  });

  it("gives every department its own colour", () => {
    const ids = [
      "team-growth",
      "team-operations",
      "team-communications",
      "team-technical",
      "team-logistics",
    ];
    const colours = ids.map((id) => teamTone(id)?.solid);
    expect(colours.every(Boolean)).toBe(true);
    expect(new Set(colours).size).toBe(ids.length);
  });

  it("returns null for unknown teams and a neutral fallback on request", () => {
    expect(teamTone("team-unknown")).toBeNull();
    expect(teamTone(undefined)).toBeNull();
    expect(teamToneOrFallback("team-unknown").solid).toMatch(/^#/);
  });
});

describe("initials", () => {
  it("uses first and last name, never just one letter for a full name", () => {
    expect(initials("Emilio Alfaro")).toBe("EA");
    expect(initials("Tamara Ortega Vargas")).toBe("TO");
    expect(initials("  ana ")).toBe("A");
  });
});
