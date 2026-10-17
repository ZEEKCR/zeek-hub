import { describe, expect, it } from "vitest";
import { searchAll, type SearchData } from "@/server/search/rules";

const data: SearchData = {
  tasks: [
    { id: "t1", title: "Diseñar stickers", status: "Lista" },
    { id: "t2", title: "Comprar snacks", status: "Por hacer" },
  ],
  activities: [{ id: "e1", title: "Meridian Side Event", kind: "Evento" }],
  resources: [
    {
      id: "r1",
      title: "Guía de marca",
      url: "https://x.test/guia",
      tags: ["brand", "diseño"],
    },
  ],
  people: [
    {
      id: "u1",
      name: "Tamara Ortega",
      team: "Operations",
      jobTitle: "Head de operaciones",
    },
  ],
};

describe("searchAll", () => {
  it("needs at least two letters", () => {
    expect(searchAll("", data)).toEqual([]);
    expect(searchAll("d", data)).toEqual([]);
  });

  it("ignores accents and case, and searches tags too", () => {
    const titles = searchAll("DISEN", data).map((result) => result.title);
    expect(titles).toEqual(["Diseñar stickers", "Guía de marca"]);
  });

  it("finds people by name, team or role and links to the directory", () => {
    const [byName] = searchAll("tamara", data);
    expect(byName?.kind).toBe("persona");
    expect(byName?.href).toBe("/personas?q=Tamara%20Ortega");
    expect(searchAll("operations", data)).toHaveLength(1);
    expect(searchAll("head de", data)).toHaveLength(1);
  });

  it("opens resources externally and tasks and events inside the hub", () => {
    expect(searchAll("guia", data)[0]).toMatchObject({
      external: true,
      href: "https://x.test/guia",
    });
    expect(searchAll("snacks", data)[0]?.href).toBe("/tareas/t2");
    expect(searchAll("meridian", data)[0]?.href).toBe("/eventos/e1");
  });

  it("keeps at most five results per kind", () => {
    const many: SearchData = {
      ...data,
      tasks: Array.from({ length: 12 }, (_, index) => ({
        id: `t${index}`,
        title: `Tarea ${index}`,
        status: "Lista",
      })),
    };
    expect(searchAll("tarea", many)).toHaveLength(5);
  });
});
