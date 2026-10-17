"use client";

import { Search } from "lucide-react";

export function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1"
      role="radiogroup"
      aria-label={label}
    >
      <button
        type="button"
        className="bg-surface-2 grid size-11 shrink-0 place-items-center rounded-full"
        aria-label="Buscar"
      >
        <Search size={18} strokeWidth={1.75} />
      </button>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors ${
              active
                ? "bg-[#f7f7f7] text-[#161616]"
                : "border-line text-muted hover:text-fg hover:bg-surface-2 border bg-transparent"
            }`}
          >
            {option.label}
            {option.count !== undefined ? ` ${option.count}` : ""}
          </button>
        );
      })}
    </div>
  );
}
