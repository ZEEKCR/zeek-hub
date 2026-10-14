import { Client, APIErrorCode, isNotionClientError } from "@notionhq/client";
import pThrottle from "p-throttle";
import { getEnv } from "@/env";

const throttle = pThrottle({ limit: 3, interval: 1000 });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt: number, retryAfter: string | null) {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }
  const base = Math.min(8000, 250 * 2 ** attempt);
  return base + Math.floor(Math.random() * 200);
}

/**
 * Throttled Notion client. The 3 req/s queue, exponential backoff and
 * Retry-After handling follow the pattern used by mlo-aa/atlas and required
 * by the ZEEK Hub plan. Atlas was not available in this workspace, so the
 * behavior was reimplemented here.
 */
export function createNotionClient() {
  const env = getEnv();
  if (!env.NOTION_ZEEK_TOKEN) throw new Error("Missing NOTION_ZEEK_TOKEN");
  const client = new Client({
    auth: env.NOTION_ZEEK_TOKEN,
    notionVersion: "2025-09-03",
  });

  async function call<T>(operation: () => Promise<T>) {
    const run = throttle(async () => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          const status =
            isNotionClientError(error) && "status" in error
              ? Number(error.status)
              : 0;
          const retryable =
            status === 429 ||
            status === 502 ||
            status === 503 ||
            error === APIErrorCode.RateLimited;
          if (!retryable || attempt === 4) throw error;
          const retryAfter =
            error instanceof Error && "headers" in error ? null : null;
          await sleep(retryDelay(attempt, retryAfter));
        }
      }
      throw lastError;
    });
    return run();
  }

  return { client, call };
}
