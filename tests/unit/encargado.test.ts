import { describe, expect, it } from "vitest";
import { assigneeKeys, tasksAssignedTo } from "@/server/catalog/focus";
import { assigneeToken } from "@/server/domain/assignee";
import { mapTaskPage } from "@/server/repositories/notion/mappers";

function page(encargado: Record<string, unknown>) {
  return {
    id: "task-1",
    last_edited_time: "2026-10-14T12:00:00.000Z",
    properties: {
      Task: { type: "title", title: [{ plain_text: "Confirmar speakers" }] },
      Status: { type: "status", status: { name: "Not started" } },
      Encargado: encargado,
    },
  };
}

describe("Encargado column", () => {
  it("reads a multi-select as assignees and exposes their names", () => {
    const mapped = mapTaskPage(
      page({
        type: "multi_select",
        multi_select: [{ name: "Abdiel Cortés" }, { name: "Ana Mora" }],
      }),
    );
    expect(mapped?.task.assigneeIds).toEqual([
      assigneeToken("Abdiel Cortés"),
      assigneeToken("Ana Mora"),
    ]);
    expect(mapped?.people.map((person) => person.name)).toEqual([
      "Abdiel Cortés",
      "Ana Mora",
    ]);
  });

  it("also reads a single select", () => {
    const mapped = mapTaskPage(
      page({ type: "select", select: { name: "Ana Mora" } }),
    );
    expect(mapped?.task.assigneeIds).toEqual([assigneeToken("Ana Mora")]);
  });

  it("matches an account by full name without caring about case or accents", () => {
    const mapped = mapTaskPage(
      page({ type: "multi_select", multi_select: [{ name: "Abdiel Cortés" }] }),
    );
    const tasks = mapped ? [mapped.task] : [];
    const keys = assigneeKeys(null, null, "ABDIEL CORTES");
    expect(tasksAssignedTo(tasks, keys)).toHaveLength(1);
    expect(
      tasksAssignedTo(tasks, assigneeKeys(null, null, "Otra Persona")),
    ).toHaveLength(0);
  });

  it("gives no keys to an account with no link and no name", () => {
    expect(assigneeKeys(null, null, undefined)).toEqual([]);
  });
});
