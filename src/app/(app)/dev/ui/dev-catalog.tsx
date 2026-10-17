"use client";

import { useState } from "react";
import { KanbanBoard, type BoardTask } from "@/components/tasks/kanban-board";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { HeroGradientCard } from "@/components/ui/hero-gradient-card";
import { KpiStat } from "@/components/ui/kpi-stat";
import { NotchedCard } from "@/components/ui/notched-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ScheduleBar } from "@/components/ui/schedule-bar";
import { TaskCard } from "@/components/ui/task-card";

const SAMPLE_TASKS: BoardTask[] = [
  {
    id: "a",
    title: "Confirmar speakers con la universidad",
    status: "not_started",
    meta: "27 oct",
    assignee: "Tamara Ortega",
    team: "Operations",
    event: "Meridian",
    priority: "P0",
    locked: false,
  },
  {
    id: "b",
    title: "Publicar página de inscripción",
    status: "in_progress",
    meta: "Venció 30 sep",
    assignee: "Esteban Brenes Montoya",
    team: "Communications",
    event: "Meridian",
    priority: "P2",
    locked: false,
  },
  {
    id: "c",
    title: "Comprar snacks y materiales",
    status: "in_progress",
    meta: "Sin fecha",
    assignee: "Sin asignar",
    team: "Logistics",
    event: "",
    locked: true,
  },
  {
    id: "d",
    title: "Revisar la pantalla del kiosko",
    status: "done",
    meta: "22 oct",
    assignee: "Emilio Alfaro",
    team: "Technical",
    event: "Meridian",
    priority: "P1",
    locked: false,
  },
];

export function DevCatalog() {
  const [filter, setFilter] = useState("all");
  return (
    <div className="grid gap-8">
      <PageHeader title="Catálogo UI" subtitle={`Filtro activo: ${filter}`} />
      <ScheduleBar
        dateLabel="Hoy"
        emptyLabel="Sin actividades hoy"
        items={[{ id: "now", time: "18:00", title: "Meridian", current: true }]}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <KpiStat label="Eventos" value="2" />
        <KpiStat label="Hechas" value="12" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <HeroGradientCard kicker="Próximo evento" value="Meridian">
          <p className="text-white/80">Texto solo sobre la zona oscura.</p>
        </HeroGradientCard>
        <Panel title="Panel" description="Contenedor base de la interfaz.">
          <p className="text-muted text-sm">Contenido del panel.</p>
        </Panel>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <TaskCard
          title="Confirmar speakers con la universidad"
          meta="27 oct, 18:00"
          assignee="Tamara Ortega"
          team="Operations"
          event="Meridian"
          status="not_started"
          priority="P0"
          active
          href="/tareas"
        />
        <TaskCard
          title="Revisar la pantalla del kiosko"
          meta="Sin fecha"
          assignee="Sin asignar"
          team="Technical"
          status="in_progress"
          priority="P3"
          href="/tareas"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <NotchedCard active actionLabel="Abrir tarea activa">
          <h2 className="text-xl font-semibold">Tarea activa</h2>
        </NotchedCard>
        <NotchedCard actionLabel="Abrir tarea">
          <h2 className="text-xl font-semibold">Tarea</h2>
        </NotchedCard>
      </div>
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
      <KanbanBoard tasks={SAMPLE_TASKS} />
      <EmptyState
        icon={<span aria-hidden>∅</span>}
        title="Estado vacío"
        hint="Texto de apoyo para cuando no hay información."
      />
    </div>
  );
}
