import { ensureMigrated, getDb } from "@/server/db/client";
import { auditLog, loginAttempts } from "@/server/db/schema";
import { requireActor } from "@/server/auth/request";
import { desc } from "drizzle-orm";

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
              {event.action} · {event.entityId ?? event.entity}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
