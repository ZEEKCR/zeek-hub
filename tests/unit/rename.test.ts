import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { authorize, type Resource } from "@/server/auth/policy";
import type { Actor, Role } from "@/server/domain/types";
import { resetMemoryStore } from "@/server/repositories/memory/store";
import {
  buildActor,
  provisionUser,
  renameAccount,
} from "@/server/services/users";

function actor(role: Role, extra: Partial<Actor> = {}): Actor {
  return {
    userId: `${role}-user`,
    volunteerId: `${role}-vol`,
    username: role,
    displayName: role,
    role,
    teamIds: ["team-growth"],
    headOfTeamIds: role === "volunteer" ? [] : ["team-growth"],
    banned: false,
    mustChangePassword: false,
    privacyAcceptedAt: "2026-10-14T00:00:00.000Z",
    tempPasswordExpiresAt: null,
    ...extra,
  };
}

describe("renameAccount", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("lets only admins rename an account", () => {
    const target: Resource = {
      kind: "user",
      role: "volunteer",
      teamIds: ["team-growth"],
    };
    expect(authorize(actor("admin"), "users.rename", target)).toBe(true);
    expect(authorize(actor("head"), "users.rename", target)).toBe(false);
    expect(authorize(actor("volunteer"), "users.rename", target)).toBe(false);
  });

  it("saves the full name and exposes it on the actor", async () => {
    const created = await provisionUser({
      username: "abdielc",
      name: "abdielc",
      role: "head",
      primaryTeamId: "team-growth",
      createdBy: null,
    });
    if (!created.ok) throw new Error("provision failed");
    const result = await renameAccount(
      actor("admin"),
      created.data.userId,
      "  Abdiel   Cole ",
    );
    expect(result).toEqual({ ok: true, data: { name: "Abdiel Cole" } });
    const rows = await getDb()
      .select()
      .from(user)
      .where(eq(user.id, created.data.userId));
    expect(rows[0]?.name).toBe("Abdiel Cole");
    const built = await buildActor(created.data.userId);
    expect(built?.fullName).toBe("Abdiel Cole");
  });

  it("rejects a non-admin and a name that is too short", async () => {
    const created = await provisionUser({
      username: "ana",
      name: "Ana Mora",
      role: "volunteer",
      primaryTeamId: "team-growth",
      createdBy: null,
    });
    if (!created.ok) throw new Error("provision failed");
    const denied = await renameAccount(
      actor("head"),
      created.data.userId,
      "Otro Nombre",
    );
    expect(denied.ok).toBe(false);
    const short = await renameAccount(actor("admin"), created.data.userId, "A");
    expect(short.ok).toBe(false);
  });
});
