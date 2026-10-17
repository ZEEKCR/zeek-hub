import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { desc, inArray } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatCostaRica } from "@/lib/dates";
import { requireActor } from "@/server/auth/request";
import { ensureMigrated, getDb } from "@/server/db/client";
import { auditLog, loginAttempts, user } from "@/server/db/schema";

export default async function SecurityPage() {
  const actor = await requireActor();
  if (actor.role !== "admin")
    return (
      <EmptyState
        icon={<ShieldOff size={20} aria-hidden />}
        title="No tiene permiso para ver esta pantalla."
      />
    );
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
  const lockedRows = locks.filter((row) => (row.failures ?? 0) > 0);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Seguridad"
        subtitle="Bloqueos de acceso y los últimos eventos de auditoría."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel title="Bloqueos">
          {lockedRows.length === 0 ? (
            <p className="text-muted text-sm">Sin intentos fallidos.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {lockedRows.map((row) => (
                <li
                  key={row.userKey}
                  className="bg-surface-2 rounded-[14px] px-3.5 py-2.5"
                >
                  <span className="font-semibold">{row.userKey}</span>:{" "}
                  {row.failures} fallos
                  {row.lockedUntil
                    ? ` · hasta ${row.lockedUntil.toISOString()}`
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Auditoría reciente">
          <ul className="grid gap-2 text-sm">
            {events.map((event) => (
              <li
                key={event.id}
                className="bg-surface-2 rounded-[14px] px-3.5 py-2.5"
              >
                <span className="text-muted block text-xs">
                  {formatCostaRica(event.at, "d MMM yyyy, HH:mm")}
                </span>
                {event.actorId
                  ? (names.get(event.actorId) ?? "Usuario")
                  : "Sistema"}{" "}
                · <span className="font-semibold">{event.action}</span>
                {event.entityId ? ` · ${event.entityId}` : ""}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
