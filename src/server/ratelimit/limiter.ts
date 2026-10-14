import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getEnv } from "@/env";

type Window = { max: number; windowMs: number };

const memoryBuckets = new Map<string, number[]>();

function memoryLimit(key: string, rule: Window) {
  const now = Date.now();
  const hits = (memoryBuckets.get(key) ?? []).filter(
    (stamp) => now - stamp < rule.windowMs,
  );
  if (hits.length >= rule.max) {
    memoryBuckets.set(key, hits);
    return false;
  }
  hits.push(now);
  memoryBuckets.set(key, hits);
  return true;
}

const upstash = new Map<string, Ratelimit>();

function upstashLimiter(rule: Window) {
  const env = getEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  const cacheKey = `${rule.max}:${rule.windowMs}`;
  const existing = upstash.get(cacheKey);
  if (existing) return existing;
  const limiter = new Ratelimit({
    redis: new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(rule.max, `${rule.windowMs} ms`),
    prefix: "zeek",
  });
  upstash.set(cacheKey, limiter);
  return limiter;
}

export async function consumeLimit(key: string, rule: Window) {
  const limiter = upstashLimiter(rule);
  if (!limiter) return memoryLimit(key, rule);
  const result = await limiter.limit(key);
  return result.success;
}

export const LIMITS = {
  loginUser: { max: 5, windowMs: 60_000 },
  loginIp: { max: 30, windowMs: 60 * 60_000 },
  credentialChange: { max: 10, windowMs: 60 * 60_000 },
  write: { max: 30, windowMs: 60_000 },
  webhook: { max: 120, windowMs: 60_000 },
} as const;
