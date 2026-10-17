import Link from "next/link";

export function QueryChips({
  label,
  pathname,
  search,
  param,
  value,
  options,
}: {
  label: string;
  pathname: string;
  search: Record<string, string | undefined>;
  param: string;
  value: string;
  options: { id: string; label: string; count?: number }[];
}) {
  return (
    <div
      className="flex [scrollbar-width:thin] items-center gap-2 overflow-x-auto pb-1"
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => {
        const params = new URLSearchParams();
        for (const [key, current] of Object.entries(search)) {
          if (current && key !== param) params.set(key, current);
        }
        if (option.id !== "all") params.set(param, option.id);
        const href = params.size ? `${pathname}?${params}` : pathname;
        const active = option.id === value;
        return (
          <Link
            key={option.id}
            href={href}
            role="radio"
            aria-checked={active}
            className={`focus-visible:outline-focus shrink-0 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              active
                ? "bg-[#f7f7f7] text-[#161616]"
                : "border-line text-muted hover:text-fg hover:bg-surface-2 border bg-transparent"
            }`}
          >
            {option.label}
            {option.count !== undefined ? ` ${option.count}` : ""}
          </Link>
        );
      })}
    </div>
  );
}
