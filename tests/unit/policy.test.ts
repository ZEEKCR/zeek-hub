import { describe, expect, it } from "vitest";
import { authorize, POLICY_ACTIONS } from "@/server/auth/policy";
import type { Actor, Role } from "@/server/domain/types";

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

describe("authorization matrix", () => {
  it("lets every role read tasks and blocks volunteers from editing someone else's task", () => {
    for (const role of ["volunteer", "head", "admin"] as const) {
      expect(authorize(actor(role), "tasks.view")).toBe(true);
    }
    expect(
      authorize(actor("volunteer"), "tasks.edit", {
        kind: "task",
        assigneeIds: ["other"],
        teamIds: ["team-growth"],
      }),
    ).toBe(false);
    expect(
      authorize(actor("volunteer"), "tasks.edit", {
        kind: "task",
        assigneeIds: ["volunteer-vol"],
        teamIds: ["team-ops"],
      }),
    ).toBe(true);
    expect(
      authorize(actor("head"), "tasks.edit", {
        kind: "task",
        assigneeIds: ["other"],
        teamIds: ["team-growth"],
      }),
    ).toBe(true);
  });

  it("limits user management to a head's own volunteers", () => {
    const head = actor("head");
    expect(
      authorize(head, "users.create", {
        kind: "user",
        role: "volunteer",
        teamIds: ["team-growth"],
      }),
    ).toBe(true);
    expect(
      authorize(head, "users.create", {
        kind: "user",
        role: "volunteer",
        teamIds: ["team-logistics"],
      }),
    ).toBe(false);
    expect(
      authorize(head, "users.create", {
        kind: "user",
        role: "head",
        teamIds: ["team-growth"],
      }),
    ).toBe(false);
    expect(
      authorize(head, "users.resetPassword", {
        kind: "user",
        role: "admin",
        teamIds: ["team-growth"],
      }),
    ).toBe(false);
    expect(
      authorize(actor("admin"), "users.create", {
        kind: "user",
        role: "head",
        teamIds: ["team-logistics"],
      }),
    ).toBe(true);
    expect(
      authorize(actor("volunteer"), "users.create", {
        kind: "user",
        role: "volunteer",
        teamIds: ["team-growth"],
      }),
    ).toBe(false);
    expect(
      authorize(head, "users.deactivate", {
        kind: "user",
        role: "volunteer",
        teamIds: [],
      }),
    ).toBe(false);
    expect(
      authorize(actor("admin"), "users.deactivate", {
        kind: "user",
        role: "volunteer",
        teamIds: [],
      }),
    ).toBe(true);
  });

  it("covers every action for the three roles", () => {
    expect(POLICY_ACTIONS.length).toBeGreaterThan(10);
    for (const action of POLICY_ACTIONS) {
      expect(typeof authorize(actor("admin"), action, { kind: "none" })).toBe(
        "boolean",
      );
    }
    expect(authorize(actor("volunteer"), "admin.audit")).toBe(false);
    expect(authorize(actor("admin"), "admin.tokens")).toBe(true);
    expect(authorize(actor("volunteer"), "resources.viewCore")).toBe(false);
    expect(authorize(actor("head"), "resources.viewCore")).toBe(true);
    expect(
      authorize(actor("volunteer"), "volunteers.viewContact", {
        kind: "volunteer",
        teamIds: ["team-logistics"],
      }),
    ).toBe(false);
    expect(
      authorize(actor("volunteer"), "volunteers.viewContact", {
        kind: "volunteer",
        teamIds: ["team-growth"],
      }),
    ).toBe(true);
  });
});
