import { describe, expect, it } from "vitest";
import {
  activityKindLabel,
  compareProjects,
  isOpenProject,
  isProject,
} from "@/server/domain/projects";
import type { Activity } from "@/server/domain/types";

const base: Activity = {
  id: "a",
  title: "Rebrand",
  kind: "Project",
  stage: "execution",
  published: true,
  teamIds: [],
  volunteerIds: [],
};

describe("projects", () => {
  it("recognises Project and Proyecto, not events", () => {
    expect(isProject({ kind: "Project" })).toBe(true);
    expect(isProject({ kind: "Proyecto" })).toBe(true);
    expect(isProject({ kind: " proyecto " })).toBe(true);
    expect(isProject({ kind: "Event" })).toBe(false);
    expect(isProject({ kind: "" })).toBe(false);
  });

  it("labels the Notion option in Spanish and leaves other kinds alone", () => {
    expect(activityKindLabel("Project")).toBe("Proyecto");
    expect(activityKindLabel("Workshop")).toBe("Workshop");
  });

  it("treats finished and cancelled projects as closed", () => {
    expect(isOpenProject(base)).toBe(true);
    expect(isOpenProject({ ...base, stage: "idea" })).toBe(true);
    expect(isOpenProject({ ...base, stage: "finished" })).toBe(false);
    expect(isOpenProject({ ...base, stage: "cancelled" })).toBe(false);
    expect(isOpenProject({ ...base, kind: "Event" })).toBe(false);
  });

  it("orders active work before ideas, then by title", () => {
    const list = [
      { stage: "idea", title: "B" },
      { stage: "execution", title: "Z" },
      { stage: "execution", title: "A" },
      { stage: "development", title: "M" },
    ] as const;
    expect([...list].sort(compareProjects).map((item) => item.title)).toEqual([
      "A",
      "Z",
      "M",
      "B",
    ]);
  });
});
