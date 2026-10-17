import { describe, expect, it } from "vitest";
import { authorize, POLICY_ACTIONS, type Resource } from "@/server/auth/policy";
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
  it("lets every role read tasks, and volunteers only move their own", () => {
    const own: Resource = {
      kind: "task",
      assigneeIds: ["volunteer-vol"],
      teamIds: ["team-ops"],
    };
    const other: Resource = {
      kind: "task",
      assigneeIds: ["someone-else"],
      teamIds: ["team-growth"],
    };
    for (const role of ["volunteer", "head", "admin"] as const) {
      expect(authorize(actor(role), "tasks.view")).toBe(true);
    }
    expect(authorize(actor("volunteer"), "tasks.move", own)).toBe(true);
    expect(authorize(actor("volunteer"), "tasks.move", other)).toBe(false);
    expect(authorize(actor("head"), "tasks.move", other)).toBe(true);
    expect(authorize(actor("admin"), "tasks.move", other)).toBe(true);
  });

  it("matches a volunteer to a task by the Encargado name", () => {
    const volunteer = actor("volunteer", {
      volunteerId: null,
      fullName: "Abdiel Cole",
    });
    expect(
      authorize(volunteer, "tasks.move", {
        kind: "task",
        assigneeIds: ["enc:abdiel cole"],
        teamIds: [],
      }),
    ).toBe(true);
    expect(
      authorize(volunteer, "tasks.move", {
        kind: "task",
        assigneeIds: ["enc:otra persona"],
        teamIds: [],
      }),
    ).toBe(false);
  });

  it("keeps editing and creating tasks to Lead and Head", () => {
    const task: Resource = {
      kind: "task",
      assigneeIds: ["volunteer-vol"],
      teamIds: ["team-ops"],
    };
    expect(authorize(actor("volunteer"), "tasks.edit", task)).toBe(false);
    expect(authorize(actor("volunteer"), "tasks.create", task)).toBe(false);
    for (const role of ["head", "admin"] as const) {
      expect(authorize(actor(role), "tasks.edit", task)).toBe(true);
      expect(authorize(actor(role), "tasks.create", task)).toBe(true);
    }
  });

  it("limits user management to Head", () => {
    const target: Resource = {
      kind: "user",
      role: "volunteer",
      teamIds: ["team-growth"],
    };
    for (const action of [
      "users.create",
      "users.resetPassword",
      "users.unlock",
      "users.deactivate",
      "users.changeRole",
      "users.rename",
      "users.delete",
    ] as const) {
      expect(authorize(actor("admin"), action, target)).toBe(true);
      expect(authorize(actor("head"), action, target)).toBe(false);
      expect(authorize(actor("volunteer"), action, target)).toBe(false);
    }
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
