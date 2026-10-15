import { describe, expect, it } from "vitest";
import { sessionDevice } from "@/lib/session-device";

describe("session device", () => {
  it("summarizes browser and operating system", () => {
    expect(
      sessionDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe("Chrome · Windows");
    expect(
      sessionDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      ),
    ).toBe("Edge · Windows");
    expect(sessionDevice("HeadlessChrome/124.0")).toBe("Chrome · Sistema");
  });
});
