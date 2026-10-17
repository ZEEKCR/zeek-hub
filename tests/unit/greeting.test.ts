import { describe, expect, it } from "vitest";
import { firstName, greeting } from "@/lib/greeting";

describe("greeting", () => {
  it("follows Costa Rica time, which is UTC-6", () => {
    expect(greeting(new Date("2026-10-17T13:00:00Z"))).toBe("Buenos días"); // 07:00
    expect(greeting(new Date("2026-10-17T18:00:00Z"))).toBe("Buenas tardes"); // 12:00
    expect(greeting(new Date("2026-10-18T00:30:00Z"))).toBe("Buenas tardes"); // 18:30
    expect(greeting(new Date("2026-10-18T01:00:00Z"))).toBe("Buenas noches"); // 19:00
    expect(greeting(new Date("2026-10-17T07:00:00Z"))).toBe("Buenas noches"); // 01:00
  });
});

describe("firstName", () => {
  it("takes the first word", () => {
    expect(firstName("Emilio Alfaro")).toBe("Emilio");
    expect(firstName("  Ana ")).toBe("Ana");
    expect(firstName("")).toBe("");
  });
});
