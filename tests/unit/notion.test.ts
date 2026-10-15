import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyNotionSignature } from "@/server/sync/signature";
import {
  mapActivityPage,
  mapTaskPage,
  mapVolunteerPage,
  notionStatusName,
} from "@/server/repositories/notion/mappers";

describe("notion boundaries", () => {
  it("accepts a valid webhook signature and rejects a bad one", () => {
    const body = JSON.stringify({ entity: { id: "page" } });
    const signature = createHmac("sha256", "secret").update(body).digest("hex");
    expect(verifyNotionSignature(body, signature, "secret")).toBe(true);
    expect(verifyNotionSignature(body, "nope", "secret")).toBe(false);
    expect(verifyNotionSignature(body, null, "secret")).toBe(false);
  });

  it("maps a volunteer page and drops a broken one only when the shape cannot be read", () => {
    const mapped = mapVolunteerPage({
      id: "vol-1",
      last_edited_time: "2026-10-14T00:00:00.000Z",
      properties: {
        Nombre: { type: "title", title: [{ plain_text: "Ana" }] },
        Usuario: { type: "rich_text", rich_text: [{ plain_text: "ana" }] },
        "ID usuario": {
          type: "rich_text",
          rich_text: [{ plain_text: "user-1" }],
        },
        Rol: { type: "select", select: { name: "Voluntario" } },
        Estado: { type: "select", select: { name: "Activo" } },
        "Equipo principal": {
          type: "relation",
          relation: [{ id: "team-growth" }],
        },
      },
    });
    expect(mapped?.name).toBe("Ana");
    expect(mapped?.role).toBe("volunteer");
    expect(mapped?.teamIds).toEqual(["team-growth"]);
  });

  it("maps a task from the existing Tasks properties", () => {
    const mapped = mapTaskPage({
      id: "task-1",
      last_edited_time: "2026-10-14T12:00:00.000Z",
      properties: {
        Task: { type: "title", title: [{ plain_text: "Cerrar lista" }] },
        Status: { type: "status", status: { name: "In progress" } },
        Priority: { type: "select", select: { name: "P1" } },
        Area: { type: "select", select: { name: "Logistics" } },
        "Due Date": { type: "date", date: { start: "2026-10-20" } },
        Assignee: {
          type: "people",
          people: [{ id: "user-1", name: "Ana" }],
        },
        Activity: { type: "relation", relation: [{ id: "event-1" }] },
      },
    });
    expect(mapped?.task.status).toBe("in_progress");
    expect(mapped?.task.teamIds).toEqual(["team-logistics"]);
    expect(mapped?.task.dueDate?.start).toBe("2026-10-20T18:00:00.000Z");
    expect(mapped?.task.dueDate?.timed).toBe(false);
    expect(notionStatusName("in_progress")).toBe("In progress");
    expect(mapped?.people[0]?.name).toBe("Ana");
  });

  it("hides a cancelled activity", () => {
    const mapped = mapActivityPage({
      id: "event-1",
      properties: {
        Activity: { type: "title", title: [{ plain_text: "Encuentro" }] },
        Type: { type: "select", select: { name: "Meetup" } },
        Status: { type: "select", select: { name: "Cancelled" } },
        Date: { type: "date", date: { start: "2026-11-01T18:00:00.000Z" } },
      },
    });
    expect(mapped?.activity.published).toBe(false);
    expect(mapped?.activity.kind).toBe("Meetup");
    expect(mapped?.activity.start).toBe("2026-11-01T18:00:00.000Z");
    expect(mapped?.activity.timed).toBe(true);
  });
});
