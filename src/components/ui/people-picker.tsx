"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { foldName } from "@/server/domain/assignee";

/**
 * Searchable multi-select for long lists of people. The chosen names are sent
 * as repeated hidden inputs, so the surrounding form needs no changes.
 */
export function PeoplePicker({
  name,
  label,
  options,
  defaultValue = [],
  disabled = false,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string[];
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const shown = useMemo(() => {
    const needle = foldName(query);
    return needle
      ? options.filter((option) => foldName(option).includes(needle))
      : options;
  }, [options, query]);

  const toggle = (value: string) =>
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );

  return (
    <div ref={root} className="relative grid gap-2">
      <span className="field-label">{label}</span>
      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="field flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed"
      >
        <span className={selected.length === 0 ? "text-muted" : ""}>
          {selected.length === 0
            ? "Escoge personas"
            : `${selected.length} ${selected.length === 1 ? "persona" : "personas"}`}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <li key={value} className="badge badge-violet gap-1">
              {value}
              {disabled ? null : (
                <button
                  type="button"
                  aria-label={`Quitar a ${value}`}
                  onClick={() => toggle(value)}
                  className="-mr-1 grid size-4 place-items-center rounded-full hover:bg-white/15"
                >
                  <X size={11} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {open ? (
        <div
          id={listId}
          className="pop bg-surface-1 border-line absolute top-full right-0 left-0 z-30 mt-1 grid gap-2 rounded-[18px] border p-2 shadow-[var(--shadow-float)]"
        >
          <label className="relative block">
            <span className="sr-only">Buscar persona</span>
            <Search
              size={15}
              aria-hidden
              className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar persona"
              className="field pl-9"
            />
          </label>
          <div className="grid max-h-60 gap-0.5 overflow-y-auto">
            {shown.map((option) => (
              <label
                key={option}
                className="hover:bg-surface-2 flex cursor-pointer items-center gap-2.5 rounded-[12px] px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                {option}
              </label>
            ))}
            {shown.length === 0 ? (
              <p className="text-muted px-3 py-2 text-sm">
                Nadie coincide con la búsqueda.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
