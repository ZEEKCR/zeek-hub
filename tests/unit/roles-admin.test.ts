import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { ensureMigrated, getDb } from "@/server/db/client";
import { account, loginAttempts, user } from "@/server/db/schema";
import type { Actor, Role } from "@/server/domain/types";
import { resetMemoryStore } from "@/server/repositories/memory/store";
import {
  changeAccountRole,
  deleteAccount,
  provisionUser,
} from "@/server/services/users";

function actor(role: Role, userId: string): Actor {
  return {
    userId,
    volunteerId: null,
    username: userId,
    displayName: userId,
    role,
    teamIds: [],
    headOfTeamIds: [],
    banned: false,
    mustChangePassword: false,
    privacyAcceptedAt: "2026-10-14T00:00:00.000Z",
    tempPasswordExpiresAt: null,
  };
}

async function create(username: string, role: Role) {
  const result = await provisionUser({
    username,
    name: username,
    role,
    primaryTeamId: "team-growth",
    createdBy: null,
  });
  if (!result.ok) throw new Error("provision failed");
  return result.data.userId;
}

describe("role changes and deletion", () => {
  beforeEach(async () => {
    resetMemoryStore();
    await ensureMigrated();
    await getDb().delete(user);
  });

  it("changes a role and keeps the last Head in place", async () => {
    const head = await create("jefe", "admin");
    const other = await create("otro", "volunteer");
    const operator = actor("admin", head);

    expect(await changeAccountRole(operator, other, "head")).toEqual({
      ok: true,
      data: { role: "head" },
    });
    const rows = await getDb().select().from(user).where(eq(user.id, other));
    expect(rows[0]?.role).toBe("head");

    expect((await changeAccountRole(operator, other, "nope")).ok).toBe(false);
    expect((await changeAccountRole(operator, head, "head")).ok).toBe(false);
  });

  it("refuses to demote the only active Head from another Head", async () => {
    const only = await create("unico", "admin");
    const helper = await create("ayuda", "head");
    // A second admin acting on the only active admin would leave none.
    await getDb()
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, helper));
    await getDb().update(user).set({ banned: true }).where(eq(user.id, helper));
    const result = await changeAccountRole(
      actor("admin", helper),
      only,
      "volunteer",
    );
    expect(result.ok).toBe(false);
  });

  it("lets only a Head change roles", async () => {
    const lead = await create("lead", "head");
    const vol = await create("vol", "volunteer");
    const result = await changeAccountRole(actor("head", lead), vol, "admin");
    expect(result.ok).toBe(false);
  });

  it("deletes an account with its credentials and attempts", async () => {
    const head = await create("jefe2", "admin");
    const victim = await create("borrar", "volunteer");
    await getDb().insert(loginAttempts).values({
      userKey: "borrar",
      failures: 1,
      lockedUntil: null,
      lastFailureAt: new Date(),
    });
    const result = await deleteAccount(actor("admin", head), victim);
    expect(result).toEqual({ ok: true, data: { username: "borrar" } });
    expect(
      await getDb().select().from(user).where(eq(user.id, victim)),
    ).toHaveLength(0);
    expect(
      await getDb().select().from(account).where(eq(account.userId, victim)),
    ).toHaveLength(0);
    expect(
      await getDb()
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.userKey, "borrar")),
    ).toHaveLength(0);
  });

  it("does not let a Head delete themselves or a non-Head delete anyone", async () => {
    const head = await create("jefe3", "admin");
    const lead = await create("lead2", "head");
    expect((await deleteAccount(actor("admin", head), head)).ok).toBe(false);
    expect((await deleteAccount(actor("head", lead), head)).ok).toBe(false);
  });
});
