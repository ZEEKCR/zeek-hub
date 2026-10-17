import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  NOTION_MODE: z.enum(["live", "mock"]).default("mock"),
  NOTION_ZEEK_TOKEN: z.string().min(1).optional(),
  NOTION_WEBHOOK_SECRET: z.string().min(1).optional(),
  HIBP_ENABLED: z.enum(["true", "false"]).default("true"),
  CRON_SECRET: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SENTRY_DSN: z.string().min(1).optional(),
  SEED_USERS: z.string().min(1).optional(),
  NOTION_DS_VOLUNTEERS: z.string().min(1).optional(),
  NOTION_DS_TEAMS: z.string().min(1).optional(),
  NOTION_DS_RESOURCES: z.string().min(1).optional(),
  NOTION_DS_TASKS: z.string().min(1).optional(),
  NOTION_DS_ACTIVITIES: z.string().min(1).optional(),
  NOTION_PARENT_PAGE_ID: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema> & {
  hibpEnabled: boolean;
};

function blankToUndefined(value: string | undefined) {
  if (value === undefined || value.trim() === "") return undefined;
  return value;
}

function read(source: NodeJS.ProcessEnv) {
  return {
    NODE_ENV: blankToUndefined(source.NODE_ENV),
    VERCEL_ENV: blankToUndefined(source.VERCEL_ENV),
    DATABASE_URL: source.DATABASE_URL,
    BETTER_AUTH_SECRET: source.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: source.BETTER_AUTH_URL,
    NOTION_MODE: source.NOTION_MODE,
    NOTION_ZEEK_TOKEN: source.NOTION_ZEEK_TOKEN,
    NOTION_WEBHOOK_SECRET: source.NOTION_WEBHOOK_SECRET,
    HIBP_ENABLED: source.HIBP_ENABLED,
    CRON_SECRET: source.CRON_SECRET,
    UPSTASH_REDIS_REST_URL: source.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: source.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: source.SENTRY_DSN,
    SEED_USERS: source.SEED_USERS,
    NOTION_DS_VOLUNTEERS: source.NOTION_DS_VOLUNTEERS,
    NOTION_DS_TEAMS: source.NOTION_DS_TEAMS,
    NOTION_DS_RESOURCES: source.NOTION_DS_RESOURCES,
    NOTION_DS_TASKS: source.NOTION_DS_TASKS,
    NOTION_DS_ACTIVITIES: source.NOTION_DS_ACTIVITIES,
    NOTION_PARENT_PAGE_ID: source.NOTION_PARENT_PAGE_ID,
  };
}

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(read(source));
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }

  const data = parsed.data;
  const production =
    data.VERCEL_ENV === "production" || data.NODE_ENV === "production";
  if (production) {
    const missing: string[] = [];
    if (!data.CRON_SECRET) missing.push("CRON_SECRET");
    if (!data.NOTION_WEBHOOK_SECRET) missing.push("NOTION_WEBHOOK_SECRET");
    if (!data.UPSTASH_REDIS_REST_URL) missing.push("UPSTASH_REDIS_REST_URL");
    if (!data.UPSTASH_REDIS_REST_TOKEN)
      missing.push("UPSTASH_REDIS_REST_TOKEN");
    if (data.NOTION_MODE === "live" && !data.NOTION_ZEEK_TOKEN)
      missing.push("NOTION_ZEEK_TOKEN");
    if (missing.length > 0) {
      throw new Error(`Missing production environment: ${missing.join(", ")}`);
    }
  }

  return { ...data, hibpEnabled: data.HIBP_ENABLED === "true" };
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv();
  return cached;
}
