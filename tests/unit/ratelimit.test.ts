import { describe, expect, it } from "vitest";
import {
  LIMITS,
  consumeLimit,
  upstashRestConfigured,
} from "@/server/ratelimit/limiter";

describe("upstash placeholder", () => {
  it("ignores the example host used in local and CI env", () => {
    expect(
      upstashRestConfigured("https://example.upstash.io", "test-token"),
    ).toBe(false);
    expect(
      upstashRestConfigured("https://usable-host.upstash.io", "real-token"),
    ).toBe(true);
  });

  it("limits in memory when the configured host is the placeholder", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    await expect(consumeLimit("login:test", LIMITS.loginUser)).resolves.toBe(
      true,
    );
  });
});
