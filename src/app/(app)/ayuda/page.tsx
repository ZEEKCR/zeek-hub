import { ChevronDown, LifeBuoy } from "lucide-react";
import { ReportForm } from "@/app/(app)/ayuda/report-form";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { requireActor } from "@/server/auth/request";

const FAQ = [
  {
    q: "¿Cómo muevo una tarea de estado?",
    a: "En Tareas, arrastra la tarjeta a otra columna o usa el selector de la tarjeta. Un Voluntario solo puede mover las tareas que tiene asignadas; Lead y Head pueden mover cualquiera.",
  },
  {
    q: "No veo mis tareas, ¿por qué?",
    a: "Las tareas se enlazan con tu cuenta por tu nombre completo, que debe ser igual al que aparece en la columna Encargado de Notion. Si no coincide, pide a un Head que lo corrija en Admin → Usuarios.",
  },
  {
    q: "¿Cómo cambio mi contraseña?",
    a: "En Perfil, pulsa «Cambiar contraseña». Debe tener al menos 12 caracteres.",
  },
  {
    q: "Olvidé mi contraseña",
    a: "Pídele a un Head que la resetee. Te entregará una contraseña temporal (con un ticket en JPG) que vence en 72 horas y se cambia al entrar.",
  },
  {
    q: "¿Cómo cambio entre modo claro y oscuro?",
    a: "Usa el botón «Tema» de la barra lateral (o «Más» en el celular). Tu elección se guarda en este navegador.",
  },
  {
    q: "¿Quién puede crear eventos, recursos y usuarios?",
    a: "Solo los Head. Los Lead crean y asignan tareas, y los Voluntarios mueven las suyas.",
  },
];

export default async function HelpPage() {
  await requireActor();
  return (
    <div className="grid gap-6">
      <PageHeader
        kicker="Soporte"
        title="Ayuda"
        subtitle="Respuestas rápidas y un formulario para avisarnos si algo falla."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel
          title="Preguntas frecuentes"
          description="Lo que más nos preguntan."
        >
          <div className="grid gap-2.5">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group bg-surface-2 rounded-[16px] px-4 py-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                  {item.q}
                  <ChevronDown
                    size={16}
                    className="text-muted shrink-0 transition group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="text-muted mt-2 text-sm leading-6">{item.a}</p>
              </details>
            ))}
          </div>
        </Panel>
        <Panel
          title="Reportar un problema o pedir ayuda"
          description="Lo recibe un Head de ZEEK."
          actions={
            <span className="bg-surface-2 text-muted grid size-10 place-items-center rounded-full">
              <LifeBuoy size={18} aria-hidden />
            </span>
          }
        >
          <ReportForm />
        </Panel>
      </div>
    </div>
  );
}
