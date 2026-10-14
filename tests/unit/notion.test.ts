import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyNotionSignature } from "@/server/sync/signature";
import { mapVolunteerPage } from "@/server/repositories/notion/mappers";

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
});
