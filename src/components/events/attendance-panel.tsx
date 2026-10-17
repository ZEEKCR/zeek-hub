import { Check, Download, Users, X } from "lucide-react";
import { rsvpAction } from "@/app/(app)/eventos/[id]/asistencia-actions";
import {
  AddShiftForm,
  ShiftControls,
} from "@/components/events/shift-controls";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCostaRica } from "@/lib/dates";
import type { AttendanceView } from "@/server/services/attendance";
import { shiftHours } from "@/server/attendance/rules";

export function AttendancePanel({
  activityId,
  view,
  canManage,
}: {
  activityId: string;
  view: AttendanceView;
  canManage: boolean;
}) {
  const choice = "btn flex-1 border border-[var(--border)] sm:flex-none";
  return (
    <section className="panel grid gap-5" aria-label="Asistencia y turnos">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Asistencia y turnos
          </h2>
          <p className="text-muted mt-0.5 text-sm">
            {view.going}{" "}
            {view.going === 1 ? "persona confirmó" : "personas confirmaron"}
            {view.notGoing > 0 ? ` · ${view.notGoing} no van` : ""}
          </p>
        </div>
        {canManage ? (
          <a
            href={`/eventos/${activityId}/reporte`}
            className="btn btn-secondary btn-sm"
          >
            <Download size={15} aria-hidden />
            Reporte CSV
          </a>
        ) : null}
      </header>

      <form action={rsvpAction} className="grid gap-2">
        <input type="hidden" name="activityId" value={activityId} />
        <p className="field-label">¿Vas a ir?</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="status"
            value="going"
            aria-pressed={view.mine === "going"}
            className={`${choice} ${view.mine === "going" ? "btn-primary border-transparent" : "btn-secondary"}`}
          >
            <Check size={16} aria-hidden />
            Voy
          </button>
          <button
            type="submit"
            name="status"
            value="not_going"
            aria-pressed={view.mine === "not_going"}
            className={`${choice} ${view.mine === "not_going" ? "bg-inverse text-bg border-transparent" : "btn-secondary"}`}
          >
            <X size={16} aria-hidden />
            No voy
          </button>
          {view.mine ? (
            <button
              type="submit"
              name="status"
              value="clear"
              className="btn btn-sm text-muted"
            >
              Quitar respuesta
            </button>
          ) : null}
        </div>
      </form>

      {view.goingNames.length > 0 ? (
        <details className="group">
          <summary className="text-muted hover:text-fg inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
            <Users size={15} aria-hidden />
            Quiénes van ({view.goingNames.length})
          </summary>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {view.goingNames.map((name) => (
              <li key={name} className="badge">
                {name}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="grid gap-3">
        <h3 className="text-base font-semibold">Turnos</h3>
        {view.shifts.length === 0 ? (
          <p className="text-muted text-sm">
            {canManage
              ? "Todavía no hay turnos. Crea el primero abajo."
              : "Todavía no hay turnos para este evento."}
          </p>
        ) : null}
        {view.shifts.map((shift) => {
          const full = shift.signedUp >= shift.capacity;
          return (
            <article
              key={shift.id}
              className="bg-surface-2 grid gap-3 rounded-[16px] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-semibold">{shift.title}</h4>
                  <p className="text-muted text-sm">
                    {formatCostaRica(shift.startsAt, "EEE d MMM, HH:mm")} –{" "}
                    {formatCostaRica(shift.endsAt, "HH:mm")} ·{" "}
                    {shiftHours(shift.startsAt, shift.endsAt)} h
                  </p>
                </div>
                <span
                  className={`badge ${full ? "badge-danger" : "badge-accent"}`}
                >
                  {shift.signedUp}/{shift.capacity} cupos
                </span>
              </div>
              <ProgressBar
                value={Math.round((shift.signedUp / shift.capacity) * 100)}
              />
              {canManage && shift.people.length > 0 ? (
                <p className="text-muted text-sm">{shift.people.join(", ")}</p>
              ) : null}
              <ShiftControls
                activityId={activityId}
                shiftId={shift.id}
                mine={shift.mine}
                full={full}
                canManage={canManage}
              />
            </article>
          );
        })}
        {canManage ? <AddShiftForm activityId={activityId} /> : null}
      </div>
    </section>
  );
}
