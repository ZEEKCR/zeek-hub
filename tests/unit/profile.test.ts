import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import type { Actor, Role } from "@/server/domain/types";
import { teamIdForArea } from "@/server/repositories/notion/mappers";
import { resetMemoryStore } from "@/server/repositories/memory/store";
import {
  buildActor,
  provisionUser,
  updateAccountProfile,
  updateOwnContact,
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

async function create(username: string) {
  const result = await provisionUser({
    username,
    name: username,
    role: "volunteer",
    primaryTeamId: "team-growth",
    createdBy: null,
  });
  if (!result.ok) throw new Error("provision failed");
  return result.data.userId;
}

describe("area to department", () => {
  it("sends the old and new Area values to the right team", () => {
    expect(teamIdForArea("Community")).toBe("team-growth");
    expect(teamIdForArea("Services")).toBe("team-growth");
    expect(teamIdForArea("Partners")).toBe("team-growth");
    expect(teamIdForArea("Growth")).toBe("team-growth");
    expect(teamIdForArea("Communications")).toBe("team-communications");
    expect(teamIdForArea("Technical")).toBe("team-technical");
    expect(teamIdForArea("Platform")).toBe("team-technical");
    expect(teamIdForArea("Ops")).toBe("team-operations");
    expect(teamIdForArea("Logistics")).toBe("team-logistics");
  });
});

describe("account profile", () => {
  beforeEach(async () => {
    resetMemoryStore();
    await ensureMigrated();
    await getDb().delete(user);
  });

  it("saves department, role name, email and phone, and exposes them on the actor", async () => {
    const admin = await create("jefe");
    const id = await create("ana");
    const result = await updateAccountProfile(actor("admin", admin), id, {
      teamId: "team-technical",
      jobTitle: "  Head de   Tecnología ",
      email: "Ana@Example.com",
      phone: "+506 8888 8888",
    });
    expect(result.ok).toBe(true);
    const [row] = await getDb().select().from(user).where(eq(user.id, id));
    expect(row?.teamId).toBe("team-technical");
    expect(row?.jobTitle).toBe("Head de Tecnología");
    expect(row?.email).toBe("ana@example.com");
    expect(row?.phone).toBe("+506 8888 8888");
    const built = await buildActor(id);
    expect(built?.teamId).toBe("team-technical");
    expect(built?.jobTitle).toBe("Head de Tecnología");
    expect(built?.teamIds).toContain("team-technical");
  });

  it("clears the contact data and rejects bad input", async () => {
    const admin = await create("jefe2");
    const id = await create("beto");
    const good = {
      teamId: "team-growth",
      jobTitle: "",
      email: "",
      phone: "",
    };
    expect(
      (await updateAccountProfile(actor("admin", admin), id, good)).ok,
    ).toBe(true);
    const [row] = await getDb().select().from(user).where(eq(user.id, id));
    expect(row?.email.endsWith("@users.invalid")).toBe(true);
    expect(row?.phone).toBeNull();
    for (const bad of [
      { ...good, teamId: "team-nope" },
      { ...good, email: "no-es-correo" },
      { ...good, phone: "abc" },
      { ...good, jobTitle: "x".repeat(61) },
    ]) {
      expect(
        (await updateAccountProfile(actor("admin", admin), id, bad)).ok,
      ).toBe(false);
    }
  });

  it("refuses a repeated email and any non-Head editor", async () => {
    const admin = await create("jefe3");
    const first = await create("uno");
    const second = await create("dos");
    const profile = {
      teamId: "team-growth",
      jobTitle: "",
      email: "x@y.co",
      phone: "",
    };
    expect(
      (await updateAccountProfile(actor("admin", admin), first, profile)).ok,
    ).toBe(true);
    expect(
      (await updateAccountProfile(actor("admin", admin), second, profile)).ok,
    ).toBe(false);
    expect(
      (
        await updateAccountProfile(actor("head", admin), second, {
          ...profile,
          email: "z@y.co",
        })
      ).ok,
    ).toBe(false);
  });
});

describe("own contact", () => {
  beforeEach(async () => {
    resetMemoryStore();
    await ensureMigrated();
    await getDb().delete(user);
  });

  it("lets a volunteer change and clear their own email and phone", async () => {
    const id = await create("lola");
    const me = actor("volunteer", id);
    const saved = await updateOwnContact(me, {
      email: " Lola@Example.com ",
      phone: "+506 7000 0000",
    });
    expect(saved.ok).toBe(true);
    const [row] = await getDb().select().from(user).where(eq(user.id, id));
    expect(row?.email).toBe("lola@example.com");
    expect(row?.phone).toBe("+506 7000 0000");
    const cleared = await updateOwnContact(me, { email: "", phone: "" });
    expect(cleared.ok).toBe(true);
    const [after] = await getDb().select().from(user).where(eq(user.id, id));
    expect(after?.email.endsWith("@users.invalid")).toBe(true);
    expect(after?.phone).toBeNull();
  });

  it("rejects bad values and an email another person uses", async () => {
    const first = await create("uno");
    const second = await create("dos");
    const me = actor("volunteer", second);
    expect((await updateOwnContact(me, { email: "x", phone: "" })).ok).toBe(
      false,
    );
    expect((await updateOwnContact(me, { email: "", phone: "abc" })).ok).toBe(
      false,
    );
    await updateOwnContact(actor("volunteer", first), {
      email: "uno@example.com",
      phone: "",
    });
    const clash = await updateOwnContact(me, {
      email: "uno@example.com",
      phone: "",
    });
    expect(clash.ok).toBe(false);
  });
});
