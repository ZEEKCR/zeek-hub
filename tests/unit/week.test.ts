import { describe, expect, it } from "vitest";
import { weekAgenda, type WeekItem } from "@/server/catalog/week";

const base = { detail: "", href: "/" } satisfies Partial<WeekItem>;

describe("weekAgenda", () => {
  it("orders by day, timed items before untimed ones, then by time", () => {
    const list = weekAgenda([
      {
        ...base,
        id: "c",
        kind: "tarea",
        title: "Sin hora",
        at: "2026-11-02T06:00:00Z",
        day: "2026-11-02",
        timed: false,
      },
      {
        ...base,
        id: "b",
        kind: "turno",
        title: "Turno tarde",
        at: "2026-11-02T20:00:00Z",
        day: "2026-11-02",
        timed: true,
      },
      {
        ...base,
        id: "a",
        kind: "tarea",
        title: "Otro día",
        at: "2026-11-01T06:00:00Z",
        day: "2026-11-01",
        timed: false,
      },
      {
        ...base,
        id: "d",
        kind: "turno",
        title: "Turno mañana",
        at: "2026-11-02T14:00:00Z",
        day: "2026-11-02",
        timed: true,
      },
    ]);
    expect(list.map((item) => item.id)).toEqual(["a", "d", "b", "c"]);
  });

  it("does not change the original list", () => {
    const original: WeekItem[] = [
      {
        ...base,
        id: "x",
        kind: "tarea",
        title: "B",
        at: "2026-11-02T06:00:00Z",
        day: "2026-11-02",
        timed: false,
      },
      {
        ...base,
        id: "y",
        kind: "tarea",
        title: "A",
        at: "2026-11-01T06:00:00Z",
        day: "2026-11-01",
        timed: false,
      },
    ];
    weekAgenda(original);
    expect(original.map((item) => item.id)).toEqual(["x", "y"]);
  });
});
