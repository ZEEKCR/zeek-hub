import { count, desc, eq } from "drizzle-orm";
import { writeAudit } from "@/server/audit/log";
import { authorize } from "@/server/auth/policy";
import { ensureMigrated, getDb } from "@/server/db/client";
import { eventSuggestions } from "@/server/db/schema";
import { err, ok, type Result } from "@/server/domain/result";
import type { Actor } from "@/server/domain/types";
import { LIMITS, consumeLimit } from "@/server/ratelimit/limiter";
import {
  parseSuggestionStatus,
  validateSuggestion,
  type SuggestionStatus,
} from "@/server/suggestions/rules";

export async function createSuggestion(
  actor: Actor,
  raw: Parameters<typeof validateSuggestion>[0],
): Promise<Result<{ id: string }>> {
  if (!authorize(actor, "suggestions.create")) {
    return err("forbidden", "No tiene permiso para sugerir eventos.");
  }
  const parsed = validateSuggestion(raw);
  if (!parsed.ok) return err("validation", parsed.message);
  const allowed = await consumeLimit(
    `suggestion:${actor.userId}`,
    LIMITS.suggestion,
  );
  if (!allowed) {
    return err(
      "rate_limited",
      "Ya enviaste varias sugerencias. Espera un rato antes de enviar otra.",
    );
  }
  await ensureMigrated();
  const input = parsed.data;
  const id = crypto.randomUUID();
  await getDb()
    .insert(eventSuggestions)
    .values({
      id,
      createdAt: new Date(),
      userId: actor.userId,
      suggesterName: actor.fullName || actor.displayName,
      kind: input.kind,
      title: input.title,
      description: input.description,
      contactName: input.contactName,
      contactInfo: input.contactInfo,
      country: input.country,
      status: "new",
    });
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "suggestion.create",
    entity: "event_suggestion",
    entityId: id,
    after: { kind: input.kind, country: input.country },
  });
  return ok({ id });
}

export async function listOwnSuggestions(actor: Actor) {
  await ensureMigrated();
  return getDb()
    .select()
    .from(eventSuggestions)
    .where(eq(eventSuggestions.userId, actor.userId))
    .orderBy(desc(eventSuggestions.createdAt))
    .limit(50);
}

export async function listSuggestions(
  actor: Actor,
  status: SuggestionStatus | "all",
) {
  if (!authorize(actor, "suggestions.manage")) return [];
  await ensureMigrated();
  return getDb()
    .select()
    .from(eventSuggestions)
    .where(status === "all" ? undefined : eq(eventSuggestions.status, status))
    .orderBy(desc(eventSuggestions.createdAt))
    .limit(200);
}

export async function countNewSuggestions(actor: Actor) {
  if (!authorize(actor, "suggestions.manage")) return 0;
  await ensureMigrated();
  const rows = await getDb()
    .select({ total: count() })
    .from(eventSuggestions)
    .where(eq(eventSuggestions.status, "new"));
  return rows[0]?.total ?? 0;
}

export async function setSuggestionStatus(
  actor: Actor,
  id: string,
  rawStatus: string,
): Promise<Result<{ status: SuggestionStatus }>> {
  if (!authorize(actor, "suggestions.manage")) {
    return err("forbidden", "No tiene permiso para gestionar sugerencias.");
  }
  const status = parseSuggestionStatus(rawStatus);
  if (!status) return err("validation", "El estado no es válido.");
  await ensureMigrated();
  const updated = await getDb()
    .update(eventSuggestions)
    .set({
      status,
      reviewedAt: status === "new" ? null : new Date(),
      reviewedBy: status === "new" ? null : actor.userId,
    })
    .where(eq(eventSuggestions.id, id))
    .returning({ id: eventSuggestions.id });
  if (updated.length === 0) {
    return err("not_found", "No se encontró la sugerencia.");
  }
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "suggestion.set_status",
    entity: "event_suggestion",
    entityId: id,
    after: { status },
  });
  return ok({ status });
}
