import { PartyPopper } from "lucide-react";
import type { UpcomingBirthday } from "@/server/birthdays/rules";

/** Celebration banner for people whose birthday is today. */
export function BirthdayBanner({
  people,
  selfId,
}: {
  people: UpcomingBirthday[];
  selfId: string;
}) {
  if (people.length === 0) return null;
  const names = people.map((person) =>
    person.userId === selfId ? "tú" : person.name,
  );
  const list =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`
      : (names[0] ?? "");
  const onlySelf = people.length === 1 && people[0]?.userId === selfId;
  return (
    <section
      aria-label="Cumpleaños de hoy"
      className="rise relative overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,#6335ED_0%,#3B7BD9_55%,#01E576_120%)] p-5 text-white shadow-[var(--shadow-card)] md:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgb(255_255_255/0.28),transparent_50%)]" />
      <div className="relative flex items-center gap-4">
        <span className="float grid size-12 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur">
          <PartyPopper size={24} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-white/85 uppercase">
            Cumpleaños de hoy
          </p>
          <p className="text-xl leading-snug font-semibold md:text-2xl">
            {onlySelf
              ? "¡Feliz cumpleaños!"
              : `Hoy cumple${people.length > 1 ? "n" : ""} ${list}`}
          </p>
          <p className="mt-0.5 text-sm text-white/85">
            {onlySelf
              ? "Todo el equipo te manda un abrazo."
              : "Mándale una felicitación."}
          </p>
        </div>
      </div>
    </section>
  );
}
