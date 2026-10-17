import { describe, expect, it } from "vitest";
import { collapsePeople } from "@/server/catalog/people";

describe("notion people", () => {
  it("drops the workspace bot and keeps one row per person", () => {
    const people = collapsePeople([
      { id: "bot", name: "ZEEK" },
      { id: "tamara-mail", name: "tortega@estudiantec.cr" },
      { id: "tamara", name: "Tamara Ortega" },
      { id: "josue-short", name: "Josuu" },
      { id: "josue", name: "Josué Valles" },
      { id: "esteban", name: "ESTEBAN BRENES MONTOYA" },
      { id: "emilio", name: "Emilio Alfaro" },
      { id: "sebastian", name: "Sebastián Ceciliano Piedra" },
    ]);
    expect(people.map((person) => person.name).sort()).toEqual([
      "Emilio Alfaro",
      "Esteban Brenes Montoya",
      "Josué Valles",
      "Sebastián Ceciliano Piedra",
      "Tamara Ortega",
    ]);
    const tamara = people.find((person) => person.name === "Tamara Ortega");
    expect(tamara?.aliasIds).toEqual(["tamara-mail"]);
    const josue = people.find((person) => person.name === "Josué Valles");
    expect(josue?.aliasIds).toEqual(["josue-short"]);
  });
});
