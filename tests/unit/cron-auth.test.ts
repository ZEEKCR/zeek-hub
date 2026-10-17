import { describe, expect, it } from "vitest";
import { authorizationMatches } from "@/app/api/cron/sync/route";

describe("cron authorization", () => {
  it("compares the bearer secret without a length shortcut", () => {
    expect(authorizationMatches("Bearer secreto-largo", "secreto-largo")).toBe(
      true,
    );
    expect(authorizationMatches("Bearer otro", "secreto-largo")).toBe(false);
    expect(authorizationMatches("secreto-largo", "secreto-largo")).toBe(false);
  });
});
