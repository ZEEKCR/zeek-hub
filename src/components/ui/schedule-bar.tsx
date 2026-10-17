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
      className="bg-inverse overflow-hidden rounded-full text-[#161616]"
      aria-label="Agenda de hoy"
    >
      <div className="flex h-14 items-center gap-3 px-3">
        <div className="shrink-0 px-2">
          <p className="text-sm font-semibold">Agenda de hoy</p>
          <p className="text-xs">{dateLabel}</p>
        </div>
        {items.length === 0 ? (
          <p className="text-sm">{emptyLabel}</p>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
              <Link
                href={items[0]?.href ?? "/calendario"}
                className="bg-accent block min-w-0 truncate rounded-full px-3 py-2 text-sm text-[#161616]"
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
                    className={`block rounded-full px-3 py-2 text-left text-sm ${item.current ? "bg-accent text-[#161616]" : "bg-white/70"}`}
                  >
                    <span className="block text-xs">{item.time}</span>
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
