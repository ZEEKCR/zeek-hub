"use client";

import { Sparkles, Users } from "lucide-react";
import { useRef, useState } from "react";
import { CountUp } from "@/components/ui/count-up";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroGradientCard } from "@/components/ui/hero-gradient-card";
import { NotchedCard } from "@/components/ui/notched-card";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { confettiBurst, confettiRain } from "@/lib/confetti";

export function MotionLab() {
  const [round, setRound] = useState(0);
  const burstButton = useRef<HTMLButtonElement>(null);

  function burst(big: boolean) {
    const box = burstButton.current?.getBoundingClientRect();
    const origin = box
      ? { x: box.left + box.width / 2, y: box.top }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    confettiBurst(origin, { count: big ? 80 : 30, power: big ? 1.5 : 1 });
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker="Solo Head"
        title="Laboratorio de movimiento"
        subtitle="Todas las animaciones juntas. Con «reducir movimiento» activado en tu sistema se ven sin animar."
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setRound((value) => value + 1)}
          >
            Repetir animaciones
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Números y barras" description="Suben desde 0 al entrar.">
          <div key={round} className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              {["12", "67%", "4.5"].map((value) => (
                <div key={value} className="bg-surface-2 rounded-[16px] p-4">
                  <p className="text-3xl font-semibold tabular-nums">
                    <CountUp value={value} />
                  </p>
                </div>
              ))}
            </div>
            <ProgressBar value={72} />
            <div className="flex items-center gap-4">
              <ProgressRing value={35} />
              <ProgressRing value={72} />
              <ProgressRing value={100} />
            </div>
          </div>
        </Panel>
        <Panel
          title="Confeti"
          description="Al completar tareas y en los cumpleaños."
        >
          <div className="flex flex-wrap gap-3">
            <button
              ref={burstButton}
              type="button"
              className="btn btn-primary"
              onClick={() => burst(false)}
            >
              Estallido
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => burst(true)}
            >
              «Cero pendientes»
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => confettiRain(3)}
            >
              Lluvia (cumpleaños)
            </button>
          </div>
        </Panel>
        <Panel
          title="Cambio de tema"
          description="El nuevo tema crece desde el botón."
        >
          <div className="flex items-center gap-4">
            <ThemeToggle variant="icon" />
            <span className="text-muted text-sm">Pulsa el botón.</span>
          </div>
        </Panel>
        <Panel title="Tarjeta con degradado vivo">
          <HeroGradientCard kicker="Próximo evento" value="Meridian">
            <p className="text-sm text-white/80">Faltan 5 días · avance 50%</p>
          </HeroGradientCard>
        </Panel>
        <Panel
          title="Brillo que sigue al cursor"
          description="Pasa el mouse. El resplandor toma el color del equipo."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <NotchedCard actionLabel="Ejemplo" accent="#6335ED">
              <h3 className="text-lg font-semibold">Operations</h3>
              <p className="mt-2 text-sm opacity-70">Violeta</p>
            </NotchedCard>
            <NotchedCard actionLabel="Ejemplo" accent="#C2185B">
              <h3 className="text-lg font-semibold">Communications</h3>
              <p className="mt-2 text-sm opacity-70">Rosa</p>
            </NotchedCard>
          </div>
        </Panel>
        <Panel title="Carga y estados vacíos">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="shimmer h-5 w-2/3 rounded-full" />
              <div className="shimmer h-20 rounded-[20px]" />
            </div>
            <EmptyState
              icon={<Users size={20} aria-hidden />}
              title="Nadie por aquí todavía."
              hint="Así se ve un estado vacío."
            />
            <p className="text-muted flex items-center gap-2 text-xs">
              <Sparkles size={14} aria-hidden />
              El menú lateral y la barra del celular usan una sola píldora que
              se desliza al cambiar de sección.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
