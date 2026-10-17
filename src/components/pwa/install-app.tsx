"use client";

import { Download, Share } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onPrompt = (event: Event) => {
    event.preventDefault();
    deferred = event as InstallPrompt;
    emit();
  };
  const onInstalled = () => {
    deferred = null;
    emit();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

type Mode = "installed" | "prompt" | "ios" | "none";

function snapshot(): Mode {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  if (deferred) return "prompt";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return "ios";
  return "none";
}

/** Install button for Chromium, and the manual steps on iPhone and iPad. */
export function InstallApp() {
  const mode = useSyncExternalStore<Mode>(subscribe, snapshot, () => "none");
  const [busy, setBusy] = useState(false);

  if (mode === "none") return null;

  const row =
    "bg-surface-2 flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left";
  const icon =
    "bg-surface-1 grid size-9 shrink-0 place-items-center rounded-full";

  if (mode === "installed") {
    return (
      <p className={row}>
        <span className={icon}>
          <Download size={17} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="text-sm font-semibold">
          ZEEK Hub ya está instalada en este dispositivo
        </span>
      </p>
    );
  }
  if (mode === "ios") {
    return (
      <p className={row}>
        <span className={icon}>
          <Share size={17} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Instalar la app</span>
          <span className="text-muted text-xs">
            En Safari toca Compartir y luego «Añadir a pantalla de inicio».
          </span>
        </span>
      </p>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      className={`${row} hover:bg-surface-3 transition-colors`}
      onClick={async () => {
        if (!deferred) return;
        setBusy(true);
        await deferred.prompt();
        await deferred.userChoice.catch(() => undefined);
        deferred = null;
        setBusy(false);
        emit();
      }}
    >
      <span className={icon}>
        <Download size={17} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">Instalar la app</span>
        <span className="text-muted text-xs">
          Ícono en tu pantalla de inicio y apertura rápida.
        </span>
      </span>
    </button>
  );
}
