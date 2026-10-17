import { describe, expect, it } from "vitest";
import { describeResourceError } from "@/server/repositories/notion/resources";

describe("describeResourceError", () => {
  it("names a missing environment variable", () => {
    expect(
      describeResourceError(new Error("Missing NOTION_DS_RESOURCES")),
    ).toContain("NOTION_DS_RESOURCES");
  });

  it("explains Notion permission and sharing errors", () => {
    expect(describeResourceError({ code: "restricted_resource" })).toContain(
      "insertar contenido",
    );
    expect(describeResourceError({ code: "object_not_found" })).toContain(
      "Compártela",
    );
  });

  it("includes Notion's text for validation errors only", () => {
    const error = Object.assign(new Error("Tipo is expected to be select."), {
      code: "validation_error",
    });
    expect(describeResourceError(error)).toContain("Tipo is expected");
    expect(describeResourceError(new Error("secret detail"))).not.toContain(
      "secret",
    );
  });
});
