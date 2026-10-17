import { desc, inArray } from "drizzle-orm";
import { formatCostaRica } from "@/lib/dates";
import { requireActor } from "@/server/auth/request";
import { ensureMigrated, getDb } from "@/server/db/client";
import { auditLog, loginAttempts, user } from "@/server/db/schema";

export default async function SecurityPage() {
  const actor = await requireActor();
  if (actor.role !== "admin")
    return <p>No tiene permiso para ver esta pantalla.</p>;
  await ensureMigrated();
  const locks = await getDb().select().from(loginAttempts);
  const events = await getDb()
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.at))
    .limit(20);
  const actorIds = [
    ...new Set(
      events.flatMap((event) => (event.actorId ? [event.actorId] : [])),
    ),
  ];
  const accounts =
    actorIds.length === 0
      ? []
      : await getDb()
          .select({ id: user.id, username: user.username })
          .from(user)
          .where(inArray(user.id, actorIds));
  const names = new Map(accounts.map((row) => [row.id, row.username]));
  return (
    <div className="grid gap-6">
      <h1 className="text-4xl font-semibold">Seguridad</h1>
      <section className="bg-surface-1 rounded-[28px] p-5">
        <h2 className="text-2xl font-semibold">Bloqueos</h2>
        <ul className="mt-3 text-sm">
          {locks
            .filter((row) => (row.failures ?? 0) > 0)
            .map((row) => (
              <li key={row.userKey}>
                {row.userKey}: {row.failures} fallos
                {row.lockedUntil
                  ? ` · hasta ${row.lockedUntil.toISOString()}`
                  : ""}
              </li>
            ))}
        </ul>
      </section>
      <section className="bg-surface-1 rounded-[28px] p-5">
        <h2 className="text-2xl font-semibold">Auditoría reciente</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {events.map((event) => (
            <li key={event.id}>
              {formatCostaRica(event.at, "d MMM yyyy, HH:mm")} ·{" "}
              {event.actorId
                ? (names.get(event.actorId) ?? "Usuario")
                : "Sistema"}{" "}
              · {event.action}
              {event.entityId ? ` · ${event.entityId}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
