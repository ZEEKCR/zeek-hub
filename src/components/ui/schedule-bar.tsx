import { CalendarClock } from "lucide-react";
import Link from "next/link";

export function ScheduleBar({
  dateLabel,
  items,
  emptyLabel,
}: {
  dateLabel: string;
  items: {
    id: string;
    time: string;
    title: string;
    current?: boolean;
    href?: string;
  }[];
  emptyLabel: string;
}) {
  return (
    <section
      className="bg-surface-1 border-line overflow-hidden rounded-full border"
      aria-label="Agenda de hoy"
    >
      <div className="flex min-h-14 items-center gap-3 px-3 py-1.5">
        <div className="flex shrink-0 items-center gap-2.5 px-2">
          <span className="bg-surface-2 text-accent-text grid size-9 place-items-center rounded-full">
            <CalendarClock size={17} aria-hidden />
          </span>
          <div>
            <p className="text-sm leading-tight font-semibold">Agenda de hoy</p>
            <p className="text-muted text-xs">{dateLabel}</p>
          </div>
        </div>
        {items.length === 0 ? (
          <p className="text-muted min-w-0 truncate text-sm">{emptyLabel}</p>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
              <Link
                href={items[0]?.href ?? "/calendario"}
                className="bg-accent block min-w-0 truncate rounded-full px-3 py-2 text-sm font-medium text-[#161616]"
              >
                {items[0]?.time} {items[0]?.title}
              </Link>
              <Link
                href="/calendario"
                className="shrink-0 text-sm font-semibold"
              >
                Ver agenda
              </Link>
            </div>
            <ol className="hidden min-w-0 flex-1 gap-2 overflow-x-auto md:flex">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href ?? "/calendario"}
                    className={`block rounded-full px-3.5 py-1.5 text-left text-sm font-medium ${item.current ? "bg-accent text-[#161616]" : "bg-surface-2"}`}
                  >
                    <span className="block text-[0.6875rem] opacity-75">
                      {item.time}
                    </span>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </section>
  );
}
