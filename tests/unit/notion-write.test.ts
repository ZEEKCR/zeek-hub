import { describe, expect, it } from "vitest";
import { notionSchema } from "@/server/repositories/notion/schema";
import {
  activityProperties,
  taskProperties,
} from "@/server/repositories/notion/write";

describe("notion write payloads", () => {
  it("builds the live task properties and can keep a timed date", () => {
    const names = notionSchema.tasks.properties;
    const properties = taskProperties({
      title: "Preparar mesa",
      status: "in_progress",
      priority: "P1",
      due: "2026-10-20",
      area: "Events",
      activityId: "act-1",
      notes: "Llevar banners",
    });
    expect(properties[names.title]).toEqual({
      title: [{ type: "text", text: { content: "Preparar mesa" } }],
    });
    expect(properties[names.status]).toEqual({
      status: { name: "In progress" },
    });
    expect(properties[names.due]).toEqual({ date: { start: "2026-10-20" } });
    expect(properties[names.priority]).toEqual({ select: { name: "P1" } });
    expect(properties[names.activity]).toEqual({
      relation: [{ id: "act-1" }],
    });

    const preserved = taskProperties(
      { title: "Preparar mesa", status: "done" },
      { preserveDue: true },
    );
    expect(preserved).not.toHaveProperty(names.due);
    expect(preserved[names.priority]).toEqual({ select: null });
    expect(preserved[names.notes]).toEqual({ rich_text: [] });
  });

  it("builds the live activity properties in the existing database", () => {
    const names = notionSchema.activities.properties;
    const properties = activityProperties({
      title: "Find Your Way",
      stage: "development",
      type: "Event",
      date: "2026-11-02",
      notes: "Confirmar sede",
    });
    expect(properties[names.title]).toEqual({
      title: [{ type: "text", text: { content: "Find Your Way" } }],
    });
    expect(properties[names.status]).toEqual({
      select: { name: "En desarrollo" },
    });
    expect(properties[names.type]).toEqual({ select: { name: "Event" } });
    expect(properties[names.date]).toEqual({ date: { start: "2026-11-02" } });

    const cleared = activityProperties(
      { title: "Charla", stage: "idea", type: "Talk" },
      { preserveDate: true },
    );
    expect(cleared).not.toHaveProperty(names.date);
    expect(cleared[names.notes]).toEqual({ rich_text: [] });
  });
});
