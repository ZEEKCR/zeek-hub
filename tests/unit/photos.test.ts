import { beforeEach, describe, expect, it } from "vitest";
import { ensureMigrated, getDb } from "@/server/db/client";
import { userPhotos } from "@/server/db/schema";
import type { Actor } from "@/server/domain/types";
import {
  MAX_PHOTO_BYTES,
  photoUrl,
  validatePhoto,
} from "@/server/photos/rules";
import {
  photoVersions,
  readPhoto,
  removeOwnPhoto,
  setOwnPhoto,
} from "@/server/services/photos";
import { attendedEvents, completedShiftHours } from "@/server/attendance/rules";

function actor(userId: string): Actor {
  return {
    userId,
    volunteerId: null,
    username: userId,
    displayName: userId,
    role: "volunteer",
    teamIds: [],
    headOfTeamIds: [],
    banned: false,
    mustChangePassword: false,
    privacyAcceptedAt: null,
    tempPasswordExpiresAt: null,
  };
}

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe("validatePhoto", () => {
  it("accepts a small JPEG", () => {
    expect(validatePhoto(jpeg).ok).toBe(true);
  });

  it("rejects empty, huge and non-JPEG files", () => {
    expect(validatePhoto(new Uint8Array()).ok).toBe(false);
    const big = new Uint8Array(MAX_PHOTO_BYTES + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect(validatePhoto(big).ok).toBe(false);
    expect(validatePhoto(new Uint8Array([0x89, 0x50, 0x4e, 0x47])).ok).toBe(
      false,
    );
    expect(validatePhoto(new TextEncoder().encode("<svg onload=x>")).ok).toBe(
      false,
    );
  });
});

describe("photos", () => {
  beforeEach(async () => {
    await ensureMigrated();
    await getDb().delete(userPhotos);
  });

  it("stores one photo per person, replaces it and removes it", async () => {
    expect((await setOwnPhoto(actor("ana"), jpeg)).ok).toBe(true);
    expect(
      (await setOwnPhoto(actor("ana"), new Uint8Array([0xff, 0xd8, 0xff, 9])))
        .ok,
    ).toBe(true);
    const stored = await readPhoto("ana");
    expect(stored?.contentType).toBe("image/jpeg");
    expect([...(stored?.bytes ?? [])]).toEqual([0xff, 0xd8, 0xff, 9]);
    expect((await photoVersions()).has("ana")).toBe(true);
    await removeOwnPhoto(actor("ana"));
    expect(await readPhoto("ana")).toBeNull();
  });

  it("does not store a bad file", async () => {
    const result = await setOwnPhoto(actor("ana"), new Uint8Array([1, 2, 3]));
    expect(result.ok).toBe(false);
    expect(await readPhoto("ana")).toBeNull();
  });

  it("builds a cache-busting url only for people with a photo", () => {
    const versions = new Map([["ana", 123]]);
    expect(photoUrl("ana", versions)).toBe("/api/avatar/ana?v=123");
    expect(photoUrl("luis", versions)).toBeUndefined();
  });
});

describe("impact helpers", () => {
  it("counts only shifts that already ended", () => {
    const now = new Date("2026-11-20T18:00:00Z");
    const hours = completedShiftHours(
      [
        {
          startsAt: new Date("2026-11-20T14:00:00Z"),
          endsAt: new Date("2026-11-20T16:30:00Z"),
        },
        {
          startsAt: new Date("2026-11-20T17:00:00Z"),
          endsAt: new Date("2026-11-20T19:00:00Z"),
        },
        {
          startsAt: new Date("2026-11-21T14:00:00Z"),
          endsAt: new Date("2026-11-21T16:00:00Z"),
        },
      ],
      now,
    );
    expect(hours).toBe(2.5);
  });

  it("counts attended events once, and only past ones", () => {
    const days = new Map([
      ["a", "2026-10-01"],
      ["b", "2026-12-01"],
    ]);
    expect(attendedEvents(["a", "a", "b", "zzz"], days, "2026-11-01")).toBe(1);
  });
});
