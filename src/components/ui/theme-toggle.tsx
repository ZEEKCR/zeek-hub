"use client";

import { Moon, Sun } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion";

const KEY = "zeek-theme";

/**
 * Switches the theme. Where the browser supports view transitions, the new
 * theme grows as a circle from the button that was pressed.
 */
function toggleTheme(origin?: Element | null) {
  const root = document.documentElement;
  const toLight = root.classList.contains("dark");
  const apply = () => {
    root.classList.toggle("dark", !toLight);
    root.classList.toggle("light", toLight);
    try {
      localStorage.setItem(KEY, toLight ? "light" : "dark");
    } catch {
      // The choice still applies for this visit if storage is blocked.
    }
  };
  const doc = document as Document & {
    startViewTransition?: (update: () => void) => unknown;
  };
  if (!doc.startViewTransition || prefersReducedMotion()) {
    apply();
    return;
  }
  const rect = origin?.getBoundingClientRect();
  root.style.setProperty(
    "--vt-x",
    `${rect ? rect.left + rect.width / 2 : window.innerWidth / 2}px`,
  );
  root.style.setProperty(
    "--vt-y",
    `${rect ? rect.top + rect.height / 2 : window.innerHeight / 2}px`,
  );
  doc.startViewTransition(apply);
}

/**
 * The icon follows the theme with CSS, so the server and the browser render
 * the same markup: the sun invites to go light, the moon to go dark.
 */
function Icons({ size }: { size: number }) {
  return (
    <>
      <Sun size={size} strokeWidth={1.75} className="hidden dark:block" />
      <Moon size={size} strokeWidth={1.75} className="dark:hidden" />
    </>
  );
}

export function ThemeToggle({
  variant = "rail",
}: {
  variant?: "rail" | "menu" | "icon" | "row";
}) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={(event) => toggleTheme(event.currentTarget)}
        aria-label="Cambiar entre modo claro y oscuro"
        title="Cambiar tema"
        className="text-muted hover:bg-surface-2 hover:text-fg grid size-10 place-items-center rounded-full transition-colors"
      >
        <Icons size={18} />
      </button>
    );
  }
  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={(event) => toggleTheme(event.currentTarget)}
        aria-label="Cambiar entre modo claro y oscuro"
        className="bg-surface-2 hover:bg-surface-3 flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-colors"
      >
        <span className="bg-surface-1 grid size-9 shrink-0 place-items-center rounded-full">
          <Icons size={17} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Apariencia</span>
          <span className="text-muted text-xs">
            <span className="hidden dark:inline">Cambiar a modo claro</span>
            <span className="dark:hidden">Cambiar a modo oscuro</span>
          </span>
        </span>
      </button>
    );
  }
  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={(event) => toggleTheme(event.currentTarget)}
        className="hover:bg-surface-2 flex min-h-11 items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-medium"
      >
        <Icons size={17} />
        <span className="hidden dark:inline">Modo claro</span>
        <span className="dark:hidden">Modo oscuro</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={(event) => toggleTheme(event.currentTarget)}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar tema"
      className="text-muted hover:bg-surface-2 hover:text-fg grid justify-items-center gap-1 rounded-2xl px-1 py-2 text-[0.6875rem] font-semibold transition-colors"
    >
      <Icons size={18} />
      Tema
    </button>
  );
}
