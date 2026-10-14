import { randomUUID } from "node:crypto";
import { desc } from "drizzle-orm";
import { getEnv } from "@/env";
import { hashIp } from "@/server/auth/session-hash";
import { ensureMigrated, getDb } from "@/server/db/client";
import { auditLog } from "@/server/db/schema";

const SECRET_KEY = /password|token|secret|authorization/i;

export function sanitizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value))
    return value.map((item) => sanitizeAuditValue(item));
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    output[key] = SECRET_KEY.test(key)
      ? "[redacted]"
      : sanitizeAuditValue(entry);
  }
  return output;
}

export async function writeAudit(entry: {
  actorType: "user" | "bot" | "system";
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  requestId?: string;
}) {
  await ensureMigrated();
  const env = getEnv();
  await getDb()
    .insert(auditLog)
    .values({
      id: randomUUID(),
      at: new Date(),
      actorType: entry.actorType,
      actorId: entry.actorId ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      before: (entry.before
        ? sanitizeAuditValue(entry.before)
        : null) as Record<string, unknown> | null,
      after: (entry.after ? sanitizeAuditValue(entry.after) : null) as Record<
        string,
        unknown
      > | null,
      ipHash: entry.ip ? hashIp(entry.ip, env.BETTER_AUTH_SECRET) : null,
      requestId: entry.requestId ?? null,
    });
}

export async function listAudit(limit = 50) {
  await ensureMigrated();
  return getDb()
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.at))
    .limit(limit);
}
