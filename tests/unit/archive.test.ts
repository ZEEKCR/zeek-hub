import { describe, expect, it } from "vitest";
import { isArchivedTask } from "@/server/catalog/archive";

describe("archived tasks", () => {
  const activities = [
    { id: "live", stage: "execution" as const },
    { id: "past", stage: "finished" as const },
  ];

  it("hides tasks of a finished event and keeps the others", () => {
    expect(isArchivedTask({ activityIds: ["past"] }, activities)).toBe(true);
    expect(isArchivedTask({ activityIds: ["live"] }, activities)).toBe(false);
    expect(isArchivedTask({ activityIds: [] }, activities)).toBe(false);
  });
});
