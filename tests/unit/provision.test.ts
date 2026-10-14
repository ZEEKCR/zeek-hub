import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { account, user } from "@/server/db/schema";
import { getDb } from "@/server/db/client";
import { repositories } from "@/server/container";
import { resetMemoryStore } from "@/server/repositories/memory/store";
import { loginWithPassword, provisionUser } from "@/server/services/users";

describe("provisionUser", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("rejects an unknown team before creating a user", async () => {
    const result = await provisionUser({
      username: "SinEquipo",
      name: "Sin Equipo",
      role: "volunteer",
      primaryTeamId: "team-missing",
      createdBy: null,
    });
    expect(result.ok).toBe(false);
    const rows = await getDb()
      .select()
      .from(user)
      .where(eq(user.username, "sinequipo"));
    expect(rows).toHaveLength(0);
  });

  it("rolls back the user and account when membership fails", async () => {
    const repos = repositories();
    const original = repos.volunteers.upsert.bind(repos.volunteers);
    repos.volunteers.upsert = () => {
      throw new Error("membership failed");
    };
    try {
      const result = await provisionUser({
        username: "Huerfano",
        name: "Huerfano",
        role: "volunteer",
        primaryTeamId: "team-growth",
        createdBy: null,
      });
      expect(result.ok).toBe(false);
      const rows = await getDb()
        .select()
        .from(user)
        .where(eq(user.username, "huerfano"));
      expect(rows).toHaveLength(0);
      const accounts = await getDb().select().from(account);
      expect(
        accounts.filter((row) => row.accountId === rows[0]?.id),
      ).toHaveLength(0);
    } finally {
      repos.volunteers.upsert = original;
    }
  });

  it("creates the user, the credential account, and the team membership", async () => {
    const result = await provisionUser({
      username: "NuevaVol",
      name: "Nueva Vol",
      role: "volunteer",
      primaryTeamId: "team-growth",
      createdBy: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const rows = await getDb()
      .select()
      .from(user)
      .where(eq(user.id, result.data.userId));
    expect(rows).toHaveLength(1);
    const accounts = await getDb()
      .select()
      .from(account)
      .where(eq(account.userId, result.data.userId));
    expect(accounts[0]?.providerId).toBe("credential");
    const team = await repositories().teams.get("team-growth");
    expect(team?.memberIds).toContain(result.data.volunteerId);

    await getDb()
      .update(user)
      .set({ banned: true })
      .where(eq(user.id, result.data.userId));
    const wrong = await loginWithPassword({
      username: "NuevaVol",
      password: "clave-incorrecta-12",
      headers: new Headers(),
    });
    const right = await loginWithPassword({
      username: "NuevaVol",
      password: result.data.tempPassword,
      headers: new Headers(),
    });
    expect(wrong.ok).toBe(false);
    expect(right.ok).toBe(false);
    if (!wrong.ok && !right.ok) {
      expect(wrong.error.message).toBe("La cuenta está inactiva.");
      expect(right.error.message).toBe(wrong.error.message);
    }
  });
});
