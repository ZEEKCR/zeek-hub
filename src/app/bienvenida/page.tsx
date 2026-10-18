import {
  CheckCircle2,
  ListChecks,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import { finishWelcomeAction } from "@/app/bienvenida/actions";
import { BrandLogo } from "@/components/ui/brand-logo";
import { firstName } from "@/lib/greeting";
import { DISCORD_INVITE } from "@/lib/links";
import { requireActor } from "@/server/auth/request";
import { loadCatalog } from "@/server/catalog/load";
import { actorAssigneeKeys } from "@/server/domain/assignee";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { getOwnBirthday } from "@/server/services/birthdays";
import { photoVersions } from "@/server/services/photos";

export default async function WelcomePage() {
  const actor = await requireActor();
  if (actor.mustChangePassword) redirect("/cambiar-contrasena");
  if (!actor.privacyAcceptedAt) redirect("/privacidad");
  if (actor.welcomeSeenAt) redirect("/inicio");

  const team = INITIAL_TEAMS.find((item) => item.id === actor.teamId);
  const catalog = await loadCatalog();
  const keys = actorAssigneeKeys(actor);
  const myTasks = catalog.tasks.filter(
    (task) =>
      task.status !== "done" &&
      task.assigneeIds.some((id) => keys.includes(id)),
  ).length;
  const profileDone =
    (await photoVersions()).has(actor.userId) &&
    (await getOwnBirthday(actor)) !== null;

  const card =
    "bg-surface-2 flex items-center gap-4 rounded-[20px] p-4 text-left transition-colors hover:bg-surface-3";
  const icon =
    "bg-surface-1 text-accent-text grid size-11 shrink-0 place-items-center rounded-full";
  return (
    <main className="bg-bg grid min-h-dvh place-items-center px-4 py-10">
      <div className="rise bg-surface-1 border-line shadow-card w-full max-w-xl rounded-[32px] border p-6 sm:p-8">
        <BrandLogo className="h-10 w-auto" />
        <p className="eyebrow mt-6">Te damos la bienvenida</p>
        <h1 className="mt-1 text-4xl leading-tight font-semibold text-balance">
          Hola, {firstName(actor.fullName || actor.displayName)}
        </h1>
        <p className="text-muted mt-3 text-base leading-7">
          {team ? (
            <>
              Eres parte de <strong className="text-fg">{team.name}</strong>
              .{" "}
            </>
          ) : null}
          Estas son tres cosas para empezar con el pie derecho. Puedes hacerlas
          ahora o cuando quieras.
        </p>

        <ol className="mt-6 grid gap-3">
          <li className="rise" style={{ animationDelay: "120ms" }}>
            <form action={finishWelcomeAction}>
              <input type="hidden" name="to" value="/perfil" />
              <button type="submit" className={`${card} w-full`}>
                <span className={icon}>
                  {profileDone ? (
                    <CheckCircle2 size={20} aria-hidden />
                  ) : (
                    <UserRound size={20} aria-hidden />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    1. Completa tu perfil
                  </span>
                  <span className="text-muted text-sm">
                    Sube tu foto y agrega tu cumpleaños para que el equipo te
                    celebre.
                  </span>
                </span>
              </button>
            </form>
          </li>
          <li className="rise" style={{ animationDelay: "240ms" }}>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className={card}
            >
              <span className={icon}>
                <MessageCircle size={20} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">2. Únete al Discord</span>
                <span className="text-muted text-sm">
                  Ahí está la comunidad de ZEEK. Se abre en otra pestaña.
                </span>
              </span>
            </a>
          </li>
          <li className="rise" style={{ animationDelay: "360ms" }}>
            <form action={finishWelcomeAction}>
              <input type="hidden" name="to" value="/tareas?mias=1" />
              <button type="submit" className={`${card} w-full`}>
                <span className={icon}>
                  <ListChecks size={20} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    3. Mira tu primera tarea
                  </span>
                  <span className="text-muted text-sm">
                    {myTasks > 0
                      ? `Tienes ${myTasks} ${myTasks === 1 ? "tarea asignada" : "tareas asignadas"}.`
                      : "Todavía no tienes tareas. Tu Head te asignará la primera."}
                  </span>
                </span>
              </button>
            </form>
          </li>
        </ol>

        <form
          action={finishWelcomeAction}
          className="rise mt-7"
          style={{ animationDelay: "480ms" }}
        >
          <input type="hidden" name="to" value="/inicio" />
          <button
            type="submit"
            className="btn btn-primary h-12 w-full text-base"
          >
            Entrar a ZEEK Hub
          </button>
        </form>
      </div>
    </main>
  );
}
