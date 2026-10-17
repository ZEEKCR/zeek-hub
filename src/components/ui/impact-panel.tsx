import { CalendarCheck, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { formatCostaRica } from "@/lib/dates";
import type { Impact } from "@/server/services/impact";

function hoursLabel(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

export function ImpactPanel({ impact }: { impact: Impact }) {
  const stats = [
    {
      icon: CheckCircle2,
      value: String(impact.tasksDone),
      label: impact.tasksDone === 1 ? "tarea completada" : "tareas completadas",
    },
    {
      icon: CalendarCheck,
      value: String(impact.eventsAttended),
      label:
        impact.eventsAttended === 1
          ? "evento al que fuiste"
          : "eventos a los que fuiste",
    },
    {
      icon: Clock,
      value: hoursLabel(impact.shiftHours),
      label: "horas en turnos",
    },
  ];
  return (
    <Panel
      title="Mi impacto"
      description={
        impact.since
          ? `Contigo en ZEEK desde ${formatCostaRica(impact.since, "MMMM 'de' yyyy")}.`
          : "Lo que has hecho en ZEEK."
      }
      actions={
        <span className="bg-surface-2 text-accent-text grid size-10 place-items-center rounded-full">
          <Sparkles size={18} aria-hidden />
        </span>
      }
    >
      <dl className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-surface-2 rounded-[16px] p-3.5">
              <Icon size={16} className="text-accent-text" aria-hidden />
              <dd className="mt-2 text-3xl leading-none font-semibold tabular-nums">
                {stat.value}
              </dd>
              <dt className="text-muted mt-1.5 text-xs leading-tight">
                {stat.label}
              </dt>
            </div>
          );
        })}
      </dl>
      {impact.tasksDone === 0 &&
      impact.eventsAttended === 0 &&
      impact.shiftHours === 0 ? (
        <p className="text-muted mt-3 text-sm">
          Aquí irá creciendo todo lo que hagas con el equipo.
        </p>
      ) : null}
    </Panel>
  );
}
