import { describe, expect, it } from "vitest";
import { hashPassword } from "@/server/auth/password";
import {
  generateTempPassword,
  unbiasedAlphabetIndex,
} from "@/server/auth/credentials";

describe("argon2id", () => {
  it("stores passwords with the argon2id prefix", async () => {
    const hashed = await hashPassword("una-clave-larga-2026");
    expect(hashed.startsWith("$argon2id$")).toBe(true);
  });
});

describe("temporary passwords", () => {
  it("rejects bytes that would bias modulo sampling", () => {
    expect(unbiasedAlphabetIndex(255)).toBeNull();
    expect(unbiasedAlphabetIndex(0)).toBe(0);
  });

  it("builds a 16 character password from the unbiased alphabet", () => {
    const password = generateTempPassword();
    expect(password).toHaveLength(16);
    expect(password).toMatch(/^[A-Za-z0-9!@#$%]+$/);
  });
});
