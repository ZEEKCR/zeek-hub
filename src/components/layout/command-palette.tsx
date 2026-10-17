"use client";

import {
  CheckSquare,
  CalendarDays,
  ExternalLink,
  FileText,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SearchKind, SearchResult } from "@/server/search/rules";

const ICONS: Record<SearchKind, typeof Search> = {
  tarea: CheckSquare,
  evento: CalendarDays,
  recurso: FileText,
  persona: UserRound,
};
const LABELS: Record<SearchKind, string> = {
  tarea: "Tareas",
  evento: "Eventos y proyectos",
  recurso: "Recursos",
  persona: "Personas",
};

/** Ctrl/Cmd+K opens it from anywhere; the buttons in the shell open it too. */
export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState("");
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error("search");
        const body = (await response.json()) as { results: SearchResult[] };
        setResults(body.results);
        setSearched(query.trim());
        setFailed(false);
        setActive(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFailed(true);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;
  const ready = query.trim().length >= 2;
  const shown = ready && searched === query.trim() ? results : [];

  function go(result: SearchResult) {
    onClose();
    if (result.external)
      window.open(result.href, "_blank", "noopener,noreferrer");
    else router.push(result.href);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar"
      className="fixed inset-0 z-50 grid content-start justify-items-center px-4 pt-[12vh]"
    >
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        className="pop absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="pop bg-surface-1 border-line relative w-full max-w-xl overflow-hidden rounded-[24px] border shadow-[var(--shadow-float)]">
        <div className="border-line flex items-center gap-3 border-b px-4">
          <Search size={18} className="text-muted shrink-0" aria-hidden />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) => Math.min(value + 1, shown.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => Math.max(value - 1, 0));
              } else if (event.key === "Enter" && shown[active]) {
                go(shown[active]);
              }
            }}
            placeholder="Busca tareas, eventos, recursos o personas"
            aria-label="Buscar"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted hover:text-fg grid size-8 place-items-center rounded-full"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!ready ? (
            <p className="text-muted px-3 py-6 text-center text-sm">
              Escribe al menos 2 letras. Con{" "}
              <kbd className="bg-surface-2 rounded px-1.5 py-0.5 text-xs">
                Ctrl
              </kbd>{" "}
              +{" "}
              <kbd className="bg-surface-2 rounded px-1.5 py-0.5 text-xs">
                K
              </kbd>{" "}
              la abres desde cualquier pantalla.
            </p>
          ) : failed ? (
            <p
              role="alert"
              className="text-danger px-3 py-6 text-center text-sm"
            >
              No se pudo buscar. Revisa tu conexión e inténtalo de nuevo.
            </p>
          ) : searched !== query.trim() ? (
            <p className="text-muted px-3 py-6 text-center text-sm">
              Buscando…
            </p>
          ) : shown.length === 0 ? (
            <p className="text-muted px-3 py-6 text-center text-sm">
              No encontramos nada para «{query.trim()}».
            </p>
          ) : (
            <ul role="listbox" aria-label="Resultados" className="grid gap-0.5">
              {shown.map((result, index) => {
                const Icon = ICONS[result.kind];
                const first =
                  index === 0 || shown[index - 1]?.kind !== result.kind;
                return (
                  <li key={`${result.kind}-${result.id}`} role="presentation">
                    {first ? (
                      <p className="eyebrow px-3 pt-3 pb-1">
                        {LABELS[result.kind]}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(result)}
                      className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left ${
                        index === active ? "bg-surface-2" : ""
                      }`}
                    >
                      <span className="bg-surface-2 text-muted grid size-8 shrink-0 place-items-center rounded-full">
                        <Icon size={15} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {result.title}
                        </span>
                        {result.subtitle ? (
                          <span className="text-muted block truncate text-xs">
                            {result.subtitle}
                          </span>
                        ) : null}
                      </span>
                      {result.external ? (
                        <ExternalLink
                          size={14}
                          className="text-muted shrink-0"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
