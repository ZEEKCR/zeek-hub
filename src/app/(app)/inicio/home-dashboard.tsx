"use client";

import { useState } from "react";
import { FilterChips } from "@/components/ui/filter-chips";
import { HeroGradientCard } from "@/components/ui/hero-gradient-card";
import { KpiStat } from "@/components/ui/kpi-stat";
import { NotchedCard } from "@/components/ui/notched-card";
import { ScheduleBar } from "@/components/ui/schedule-bar";

const tasks = [
  {
    id: "today",
    title: "Confirmar voluntarios de Meridian",
    meta: "Hoy · 18:00",
    active: true,
  },
  {
    id: "progress",
    title: "Revisar guion de bienvenida",
    meta: "En progreso",
    active: false,
  },
];

export function HomeDashboard({ name }: { name: string }) {
  const [filter, setFilter] = useState("all");
  const visible =
    filter === "progress" ? tasks.filter((task) => !task.active) : tasks;
  return (
    <div className="grid gap-8">
      <ScheduleBar
        dateLabel="Hoy"
        emptyLabel="Sin actividades hoy"
        items={[
          { id: "1", time: "18:00", title: "Meridian", current: true },
          { id: "2", time: "20:00", title: "Cierre de tareas", current: false },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold tracking-tight">
          Hola, {name}
        </h1>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiStat
          label="Mis tareas abiertas"
          value="4"
          delta="+1 esta semana"
          direction="up"
        />
        <KpiStat label="Vencen esta semana" value="2" />
        <KpiStat label="Próximos eventos" value="3" />
        <KpiStat
          label="Tareas Done este mes"
          value="6"
          delta="+3 esta semana"
          direction="up"
        />
      </div>
      <HeroGradientCard kicker="Próximo evento" value="Meridian">
        <p className="text-sm text-white/80">
          Cuenta regresiva de ejemplo. El calendario real llega en la fase de
          eventos.
        </p>
      </HeroGradientCard>
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Mis tareas de hoy</h2>
        <FilterChips
          label="Filtro de tareas"
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "Todas" },
            { id: "late", label: "Vencidas" },
            { id: "today", label: "Hoy" },
            { id: "progress", label: "En progreso" },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((task) => (
            <NotchedCard
              key={task.id}
              active={task.active}
              actionLabel={`Abrir ${task.title}`}
            >
              <p className="text-sm text-current/70">Equipo</p>
              <h3 className="mt-2 text-xl font-semibold">{task.title}</h3>
              <p className="mt-3 text-sm">{task.meta}</p>
            </NotchedCard>
          ))}
        </div>
      </section>
      <section className="bg-surface-1 rounded-[28px] p-5">
        <h2 className="text-2xl font-semibold">Avisos</h2>
        <p className="text-muted mt-2">No hay avisos nuevos.</p>
      </section>
    </div>
  );
}
