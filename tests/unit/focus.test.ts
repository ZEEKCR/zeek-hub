import { describe, expect, it } from "vitest";
import { clockLabel, formatWhen } from "@/lib/dates";
import {
  isPastDue,
  isTodayOrOverdue,
  tasksAssignedTo,
} from "@/server/catalog/focus";
import type { Task } from "@/server/domain/types";

function task(
  partial: Partial<Task> & Pick<Task, "id" | "dueDate" | "status">,
): Task {
  return {
    title: partial.id,
    assigneeIds: ["person-1"],
    teamIds: [],
    activityIds: [],
    updatedAt: "2026-10-14T18:00:00.000Z",
    ...partial,
  };
}

describe("home task scope", () => {
  const today = task({
    id: "today",
    status: "not_started",
    dueDate: { start: "2026-10-14T18:00:00.000Z", timed: false },
  });
  const late = task({
    id: "late",
    status: "in_progress",
    dueDate: { start: "2026-10-01T18:00:00.000Z", timed: false },
  });
  const doneLate = task({
    id: "done",
    status: "done",
    dueDate: { start: "2026-10-01T18:00:00.000Z", timed: false },
  });
  const future = task({
    id: "future",
    status: "not_started",
    dueDate: { start: "2026-10-20T18:00:00.000Z", timed: false },
  });

  it("keeps today and overdue tasks assigned to the user", () => {
    const rows = [today, late, doneLate, future];
    expect(tasksAssignedTo(rows, [])).toEqual([]);
    const mine = tasksAssignedTo(rows, ["person-1"]).filter((item) =>
      isTodayOrOverdue(item, "2026-10-14"),
    );
    expect(mine.map((item) => item.id)).toEqual(["today", "late"]);
  });

  it("omits the clock when the Notion date has no time", () => {
    expect(clockLabel("2026-10-20T18:00:00.000Z", false)).toBe("");
    expect(
      formatWhen("2026-10-20T18:00:00.000Z", false, "d MMM, HH:mm", "d MMM"),
    ).toBe("20 oct");
  });
});

describe("past due tasks", () => {
  const base: Task = {
    id: "t",
    title: "t",
    status: "in_progress",
    assigneeIds: [],
    teamIds: [],
    activityIds: [],
    updatedAt: "2026-10-14T18:00:00.000Z",
  };

  it("is true only when the due day is before today, in any status", () => {
    const today = "2026-10-17";
    const due = (start: string, status: Task["status"] = "in_progress") => ({
      ...base,
      status,
      dueDate: { start, timed: false },
    });
    expect(isPastDue(due("2026-09-30T18:00:00.000Z"), today)).toBe(true);
    expect(isPastDue(due("2026-09-30T18:00:00.000Z", "done"), today)).toBe(
      true,
    );
    expect(isPastDue(due("2026-10-17T18:00:00.000Z"), today)).toBe(false);
    expect(isPastDue(due("2026-10-24T18:00:00.000Z"), today)).toBe(false);
    expect(isPastDue(base, today)).toBe(false);
  });
});
