import { describe, expect, it } from "vitest";
import {
  isLocked,
  isManualLock,
  lockoutAfterFailure,
} from "@/server/auth/lockout";

describe("lockout", () => {
  const now = new Date("2026-10-14T12:00:00.000Z");

  it("locks for 15 minutes on the fifth failure", () => {
    const result = lockoutAfterFailure(4, now);
    expect(result.failures).toBe(5);
    expect(result.lockedUntil?.getTime()).toBe(now.getTime() + 15 * 60 * 1000);
    expect(isLocked(result.lockedUntil, now)).toBe(true);
  });

  it("locks for one hour on the tenth failure", () => {
    const result = lockoutAfterFailure(9, now);
    expect(result.lockedUntil?.getTime()).toBe(now.getTime() + 60 * 60 * 1000);
  });

  it("requires a manual unlock on the twentieth failure", () => {
    const result = lockoutAfterFailure(19, now);
    expect(isManualLock(result.lockedUntil)).toBe(true);
  });
});
