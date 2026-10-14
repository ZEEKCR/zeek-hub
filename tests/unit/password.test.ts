import { describe, expect, it } from "vitest";
import { hashPassword } from "@/server/auth/password";

describe("argon2id", () => {
  it("stores passwords with the argon2id prefix", async () => {
    const hashed = await hashPassword("una-clave-larga-2026");
    expect(hashed.startsWith("$argon2id$")).toBe(true);
  });
});
