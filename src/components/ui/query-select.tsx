"use client";

import { useRouter } from "next/navigation";

export function QuerySelect({
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
  options: { id: string; label: string }[];
}) {
  const router = useRouter();
  return (
    <label className="text-muted grid min-w-0 gap-1 text-xs font-semibold">
      {label}
      <select
        className="field text-fg h-11 rounded-full px-4 text-sm font-medium"
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams();
          for (const [key, current] of Object.entries(search)) {
            if (current && key !== param) params.set(key, current);
          }
          const next = event.target.value;
          if (next && next !== "all") params.set(param, next);
          const href = params.size ? `${pathname}?${params}` : pathname;
          router.push(href);
        }}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
