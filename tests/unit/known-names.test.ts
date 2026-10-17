import { describe, expect, it } from "vitest";
import { emptyCatalog, viewOf } from "@/server/catalog/view";

const catalog = {
  ...emptyCatalog(),
  people: [
    { id: "p1", name: "Ana Mora", aliasIds: ["n1"] },
    { id: "p2", name: "Luis Soto", aliasIds: [] },
  ],
} as never;

describe("knownNames", () => {
  const view = viewOf(catalog);

  it("leaves out ids that match nobody, so no 'Sin asignar' avatar appears", () => {
    expect(view.knownNames(["x1", "p1"])).toEqual(["Ana Mora"]);
    expect(view.knownNames(["x1"])).toEqual([]);
    expect(view.knownNames([])).toEqual([]);
  });

  it("matches by alias and does not repeat a person", () => {
    expect(view.knownNames(["n1", "p1", "p2"])).toEqual([
      "Ana Mora",
      "Luis Soto",
    ]);
  });
});
