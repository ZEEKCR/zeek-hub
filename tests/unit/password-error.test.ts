import { describe, expect, it } from "vitest";
import { describePasswordChangeError } from "@/server/services/users";

describe("describePasswordChangeError", () => {
  it("turns a wrong current password into a clear message", () => {
    const error = Object.assign(new Error("Invalid password"), {
      body: { code: "INVALID_PASSWORD", message: "Invalid password" },
    });
    expect(describePasswordChangeError(error)).toContain(
      "contraseña actual no es correcta",
    );
  });

  it("explains length problems", () => {
    expect(
      describePasswordChangeError({ body: { code: "PASSWORD_TOO_SHORT" } }),
    ).toContain("largo");
  });

  it("leaves unknown errors to be thrown", () => {
    expect(describePasswordChangeError(new Error("boom"))).toBeNull();
    expect(describePasswordChangeError(null)).toBeNull();
    expect(describePasswordChangeError({ body: { code: "OTHER" } })).toBeNull();
  });
});
