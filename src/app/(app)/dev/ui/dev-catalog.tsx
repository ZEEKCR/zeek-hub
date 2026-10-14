"use client";

import { useState } from "react";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { FilterChips } from "@/components/ui/filter-chips";
import { HeroGradientCard } from "@/components/ui/hero-gradient-card";
import { KpiStat } from "@/components/ui/kpi-stat";
import { NotchedCard } from "@/components/ui/notched-card";
import { ScheduleBar } from "@/components/ui/schedule-bar";

export function DevCatalog() {
  const [filter, setFilter] = useState("all");
  return (
    <div className="grid gap-8">
      <h1 className="text-4xl font-semibold">Catálogo UI</h1>
      <p className="text-muted text-sm">Filtro activo: {filter}</p>
      <ScheduleBar
        dateLabel="Hoy"
        emptyLabel="Sin actividades hoy"
        items={[{ id: "now", time: "18:00", title: "Meridian", current: true }]}
      />
      <div className="grid grid-cols-2 gap-4">
        <KpiStat
          label="Abiertas"
          value="4"
          delta="+3 esta semana"
          direction="up"
        />
        <KpiStat
          label="Bloqueadas"
          value="1"
          delta="-1 esta semana"
          direction="down"
        />
      </div>
      <HeroGradientCard kicker="Próximo evento" value="Meridian">
        <p className="text-white/80">Texto solo sobre la zona oscura.</p>
      </HeroGradientCard>
      <NotchedCard active actionLabel="Abrir tarea activa">
        <h2 className="text-xl font-semibold">Tarea activa</h2>
      </NotchedCard>
      <NotchedCard actionLabel="Abrir tarea">
        <h2 className="text-xl font-semibold">Tarea</h2>
      </NotchedCard>
      <FilterChips
        label="Ejemplo"
        value={filter}
        onChange={setFilter}
        options={[
          { id: "all", label: "Todas" },
          { id: "mine", label: "Solo mías" },
        ]}
      />
      <AvatarStack names={["Ana", "Luis", "Sol", "Ken", "Mar"]} />
    </div>
  );
}
