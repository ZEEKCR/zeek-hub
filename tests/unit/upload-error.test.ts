import { describe, expect, it } from "vitest";
import { uploadErrorMessage } from "@/app/(app)/recursos/resource-form";

describe("uploadErrorMessage", () => {
  it("explains the missing Blob setup in Spanish", () => {
    const text = uploadErrorMessage(
      new Error("Vercel Blob: Failed to retrieve the client token"),
    );
    expect(text).toContain("Vercel Blob");
    expect(text).toContain("enlace");
    expect(uploadErrorMessage(new Error("No token found"))).toContain(
      "Vercel Blob",
    );
  });

  it("keeps other messages and falls back when there is none", () => {
    expect(uploadErrorMessage(new Error("El archivo supera 25 MB."))).toBe(
      "El archivo supera 25 MB.",
    );
    expect(uploadErrorMessage("x")).toBe("No se pudo subir el archivo.");
  });
});
