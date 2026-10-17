import { and, count, desc, eq } from "drizzle-orm";
import { writeAudit } from "@/server/audit/log";
import { authorize } from "@/server/auth/policy";
import { ensureMigrated, getDb } from "@/server/db/client";
import { reports } from "@/server/db/schema";
import { err, ok, type Result } from "@/server/domain/result";
import type { Actor } from "@/server/domain/types";
import { LIMITS, consumeLimit } from "@/server/ratelimit/limiter";
import { validateReport, type ReportInput } from "@/server/reports/rules";

export type ReportStatus = "open" | "resolved";

export async function createReport(
  actor: Actor,
  raw: Parameters<typeof validateReport>[0],
): Promise<Result<{ id: string }>> {
  if (!authorize(actor, "reports.create")) {
    return err("forbidden", "No tiene permiso para enviar reportes.");
  }
  const parsed = validateReport(raw);
  if (!parsed.ok) return err("validation", parsed.message);
  const allowed = await consumeLimit(`report:${actor.userId}`, LIMITS.report);
  if (!allowed) {
    return err(
      "rate_limited",
      "Ya enviaste varios reportes. Espera un rato antes de enviar otro.",
    );
  }
  await ensureMigrated();
  const input: ReportInput = parsed.data;
  const id = crypto.randomUUID();
  await getDb()
    .insert(reports)
    .values({
      id,
      createdAt: new Date(),
      userId: actor.userId,
      reporterName: actor.fullName || actor.displayName,
      kind: input.kind,
      subject: input.subject,
      message: input.message,
      screen: input.screen,
      userAgent: input.userAgent || null,
      status: "open",
    });
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "report.create",
    entity: "report",
    entityId: id,
    after: { kind: input.kind, screen: input.screen },
  });
  return ok({ id });
}

export async function listReports(actor: Actor, status: ReportStatus | "all") {
  if (!authorize(actor, "reports.manage")) return [];
  await ensureMigrated();
  const rows = await getDb()
    .select()
    .from(reports)
    .where(status === "all" ? undefined : eq(reports.status, status))
    .orderBy(desc(reports.createdAt))
    .limit(200);
  return rows;
}

export async function countOpenReports(actor: Actor) {
  if (!authorize(actor, "reports.manage")) return 0;
  await ensureMigrated();
  const rows = await getDb()
    .select({ total: count() })
    .from(reports)
    .where(eq(reports.status, "open"));
  return rows[0]?.total ?? 0;
}

export async function setReportStatus(
  actor: Actor,
  id: string,
  status: ReportStatus,
): Promise<Result<{ status: ReportStatus }>> {
  if (!authorize(actor, "reports.manage")) {
    return err("forbidden", "No tiene permiso para gestionar reportes.");
  }
  if (status !== "open" && status !== "resolved") {
    return err("validation", "El estado no es válido.");
  }
  await ensureMigrated();
  const updated = await getDb()
    .update(reports)
    .set({
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
      resolvedBy: status === "resolved" ? actor.userId : null,
    })
    .where(and(eq(reports.id, id)))
    .returning({ id: reports.id });
  if (updated.length === 0)
    return err("not_found", "No se encontró el reporte.");
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "report.set_status",
    entity: "report",
    entityId: id,
    after: { status },
  });
  return ok({ status });
}
