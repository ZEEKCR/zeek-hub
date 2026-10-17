import { and, isNotNull, eq } from "drizzle-orm";
import { writeAudit } from "@/server/audit/log";
import { authorize } from "@/server/auth/policy";
import { ensureMigrated, getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { err, ok, type Result } from "@/server/domain/result";
import type { Actor } from "@/server/domain/types";
import {
  upcomingBirthdays,
  validateBirthday,
  type Birthday,
  type UpcomingBirthday,
} from "@/server/birthdays/rules";

export async function getOwnBirthday(actor: Actor): Promise<Birthday | null> {
  await ensureMigrated();
  const [row] = await getDb()
    .select({ month: user.birthMonth, day: user.birthDay })
    .from(user)
    .where(eq(user.id, actor.userId));
  return row?.month && row.day ? { month: row.month, day: row.day } : null;
}

/** Each person sets only their own birthday; `null` removes it. */
export async function setOwnBirthday(
  actor: Actor,
  raw: { month: number; day: number } | null,
): Promise<Result<Birthday | null>> {
  if (!authorize(actor, "birthdays.edit")) {
    return err("forbidden", "No tiene permiso para cambiar el cumpleaños.");
  }
  let birthday: Birthday | null = null;
  if (raw) {
    const parsed = validateBirthday(raw.month, raw.day);
    if (!parsed.ok) return err("validation", parsed.message);
    birthday = parsed.data;
  }
  await ensureMigrated();
  await getDb()
    .update(user)
    .set({
      birthMonth: birthday?.month ?? null,
      birthDay: birthday?.day ?? null,
    })
    .where(eq(user.id, actor.userId));
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "birthday.set",
    entity: "user",
    entityId: actor.userId,
    after: { set: birthday !== null },
  });
  return ok(birthday);
}

export async function listUpcomingBirthdays(
  actor: Actor,
  today: string,
  windowDays = 30,
): Promise<UpcomingBirthday[]> {
  if (!authorize(actor, "content.view")) return [];
  await ensureMigrated();
  const rows = await getDb()
    .select({
      userId: user.id,
      name: user.name,
      month: user.birthMonth,
      day: user.birthDay,
    })
    .from(user)
    .where(
      and(
        isNotNull(user.birthMonth),
        isNotNull(user.birthDay),
        eq(user.banned, false),
      ),
    );
  return upcomingBirthdays(
    rows.flatMap((row) =>
      row.month && row.day
        ? [
            {
              userId: row.userId,
              name: row.name,
              month: row.month,
              day: row.day,
            },
          ]
        : [],
    ),
    today,
    windowDays,
  );
}
