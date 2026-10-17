import { eq } from "drizzle-orm";
import { writeAudit } from "@/server/audit/log";
import { authorize } from "@/server/auth/policy";
import { ensureMigrated, getDb } from "@/server/db/client";
import { userPhotos } from "@/server/db/schema";
import { err, ok, type Result } from "@/server/domain/result";
import type { Actor } from "@/server/domain/types";
import { validatePhoto } from "@/server/photos/rules";

export async function setOwnPhoto(
  actor: Actor,
  bytes: Uint8Array,
): Promise<Result<null>> {
  if (!authorize(actor, "profile.photo")) {
    return err("forbidden", "No tiene permiso para cambiar la foto.");
  }
  const parsed = validatePhoto(bytes);
  if (!parsed.ok) return err("validation", parsed.message);
  await ensureMigrated();
  const now = new Date();
  const data = Buffer.from(bytes).toString("base64");
  await getDb()
    .insert(userPhotos)
    .values({
      userId: actor.userId,
      contentType: "image/jpeg",
      data,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userPhotos.userId,
      set: { contentType: "image/jpeg", data, updatedAt: now },
    });
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "photo.set",
    entity: "user",
    entityId: actor.userId,
    after: { bytes: bytes.length },
  });
  return ok(null);
}

export async function removeOwnPhoto(actor: Actor): Promise<Result<null>> {
  if (!authorize(actor, "profile.photo")) {
    return err("forbidden", "No tiene permiso para cambiar la foto.");
  }
  await ensureMigrated();
  await getDb().delete(userPhotos).where(eq(userPhotos.userId, actor.userId));
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "photo.remove",
    entity: "user",
    entityId: actor.userId,
  });
  return ok(null);
}

export async function readPhoto(userId: string) {
  await ensureMigrated();
  const [row] = await getDb()
    .select()
    .from(userPhotos)
    .where(eq(userPhotos.userId, userId));
  if (!row) return null;
  return {
    bytes: Buffer.from(row.data, "base64"),
    contentType: row.contentType,
    updatedAt: row.updatedAt,
  };
}

/** Which people have a photo, and a number that changes when it does. */
export async function photoVersions() {
  await ensureMigrated();
  const rows = await getDb()
    .select({ userId: userPhotos.userId, updatedAt: userPhotos.updatedAt })
    .from(userPhotos);
  return new Map(rows.map((row) => [row.userId, row.updatedAt.getTime()]));
}
