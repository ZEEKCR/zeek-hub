import { eq } from "drizzle-orm";
import { writeAudit } from "@/server/audit/log";
import { authorize } from "@/server/auth/policy";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user, volunteerAgreements } from "@/server/db/schema";
import { err, ok, type Result } from "@/server/domain/result";
import type { Actor } from "@/server/domain/types";
import { LIMITS, consumeLimit } from "@/server/ratelimit/limiter";
import { cleanFilename, validateAgreement } from "@/server/agreements/rules";

export type AgreementMeta = {
  filename: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string | null;
};

export type AgreementRow = {
  userId: string;
  name: string;
  username: string | null;
  role: string;
  teamId: string | null;
  jobTitle: string | null;
  agreement: AgreementMeta | null;
};

const META = {
  filename: volunteerAgreements.filename,
  size: volunteerAgreements.size,
  uploadedAt: volunteerAgreements.uploadedAt,
  uploadedBy: volunteerAgreements.uploadedBy,
};

async function audit(
  actor: Actor,
  action: string,
  targetUserId: string,
  after?: Record<string, unknown>,
) {
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action,
    entity: "agreement",
    entityId: targetUserId,
    ...(after ? { after } : {}),
  });
}

/**
 * Saves the signed PDF. Everyone can upload their own; only a Head can upload
 * for someone else. Uploading again replaces the previous file.
 */
export async function saveAgreement(
  actor: Actor,
  targetUserId: string,
  filename: string,
  bytes: Uint8Array,
): Promise<Result<AgreementMeta>> {
  const forSomeoneElse = targetUserId !== actor.userId;
  if (
    !authorize(
      actor,
      forSomeoneElse ? "agreements.manage" : "agreements.upload",
    )
  ) {
    return err("forbidden", "No tiene permiso para subir este acuerdo.");
  }
  const allowed = await consumeLimit(
    `agreement:${actor.userId}`,
    LIMITS.agreement,
  );
  if (!allowed) {
    return err(
      "rate_limited",
      "Subiste varios archivos seguidos. Espera un rato.",
    );
  }
  const parsed = validateAgreement(bytes);
  if (!parsed.ok) return err("validation", parsed.message);
  await ensureMigrated();
  const db = getDb();
  const [target] = await db
    .select({ id: user.id, banned: user.banned })
    .from(user)
    .where(eq(user.id, targetUserId));
  if (!target || target.banned) {
    return err("not_found", "No encontramos esa cuenta.");
  }
  const meta: AgreementMeta = {
    filename: cleanFilename(filename),
    size: bytes.length,
    uploadedAt: new Date(),
    uploadedBy: actor.userId,
  };
  const data = Buffer.from(bytes).toString("base64");
  await db
    .insert(volunteerAgreements)
    .values({ userId: targetUserId, ...meta, data })
    .onConflictDoUpdate({
      target: volunteerAgreements.userId,
      set: { ...meta, data },
    });
  await audit(actor, "agreement.upload", targetUserId, {
    onBehalf: forSomeoneElse,
    size: meta.size,
  });
  return ok(meta);
}

export async function getAgreementMeta(
  userId: string,
): Promise<AgreementMeta | null> {
  await ensureMigrated();
  const [row] = await getDb()
    .select(META)
    .from(volunteerAgreements)
    .where(eq(volunteerAgreements.userId, userId));
  return row ?? null;
}

/** A person reads their own file; a Head reads anyone's, and that is logged. */
export async function readAgreement(actor: Actor, userId: string) {
  const own = userId === actor.userId;
  if (!own && !authorize(actor, "agreements.manage")) return null;
  await ensureMigrated();
  const [row] = await getDb()
    .select()
    .from(volunteerAgreements)
    .where(eq(volunteerAgreements.userId, userId));
  if (!row) return null;
  if (!own) await audit(actor, "agreement.download", userId);
  return {
    bytes: Buffer.from(row.data, "base64"),
    filename: row.filename,
    uploadedAt: row.uploadedAt,
  };
}

export async function removeAgreement(
  actor: Actor,
  userId: string,
): Promise<Result<null>> {
  if (!authorize(actor, "agreements.manage")) {
    return err("forbidden", "Solo un Head puede quitar un acuerdo.");
  }
  await ensureMigrated();
  await getDb()
    .delete(volunteerAgreements)
    .where(eq(volunteerAgreements.userId, userId));
  await audit(actor, "agreement.delete", userId);
  return ok(null);
}

/** Everyone with an active account and whether their agreement is in. Never loads the files. */
export async function listAgreementStatus(
  actor: Actor,
): Promise<AgreementRow[]> {
  if (!authorize(actor, "agreements.manage")) return [];
  await ensureMigrated();
  const db = getDb();
  const people = await db
    .select({
      userId: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      teamId: user.teamId,
      jobTitle: user.jobTitle,
      banned: user.banned,
    })
    .from(user);
  const files = await db
    .select({ userId: volunteerAgreements.userId, ...META })
    .from(volunteerAgreements);
  const byUser = new Map(files.map((file) => [file.userId, file]));
  return people
    .filter((person) => !person.banned)
    .map((person) => {
      const file = byUser.get(person.userId);
      return {
        userId: person.userId,
        name: person.name,
        username: person.username,
        role: person.role,
        teamId: person.teamId,
        jobTitle: person.jobTitle,
        agreement: file
          ? {
              filename: file.filename,
              size: file.size,
              uploadedAt: file.uploadedAt,
              uploadedBy: file.uploadedBy,
            }
          : null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}
