import { describe, expect, it } from "vitest";
import { validatePassword } from "@/server/auth/password-policy";

describe("password policy", () => {
  it("rejects short passwords and accepts a long unique one", () => {
    expect(validatePassword("corta", "ana")).toBe("length");
    expect(validatePassword("a".repeat(129), "ana")).toBe("length");
    expect(validatePassword("Ana Larga 2026!", "ana")).toBeNull();
  });

  it("rejects the username and common passwords", () => {
    expect(validatePassword("usuario-largo", "usuario-largo")).toBe("username");
    expect(validatePassword("unbelievable", "ana")).toBe("common");
  });

  it("normalizes unicode before measuring", () => {
    const composed = "\u00e9".repeat(12);
    expect(validatePassword(composed, "ana")).toBeNull();
  });
});
