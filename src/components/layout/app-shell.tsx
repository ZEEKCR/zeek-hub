"use client";

import {
  CalendarDays,
  Home,
  KanbanSquare,
  Library,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const items = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/tareas", label: "Tareas", icon: KanbanSquare },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/eventos", label: "Eventos", icon: Sparkles },
  { href: "/equipos", label: "Equipos", icon: Users },
  { href: "/recursos", label: "Recursos", icon: Library },
];

export function AppShell({
  children,
  name,
  admin,
}: {
  children: ReactNode;
  name: string;
  admin: boolean;
}) {
  const pathname = usePathname();
  const mobile = items.slice(0, 4);
  const [moreOpen, setMoreOpen] = useState(false);
  const more = [
    { href: "/equipos", label: "Equipos" },
    { href: "/recursos", label: "Recursos" },
    { href: "/perfil", label: "Perfil" },
    ...(admin ? [{ href: "/admin/usuarios", label: "Admin" }] : []),
  ];
  return (
    <div className="bg-bg text-fg min-h-dvh">
      <aside className="fixed top-0 left-0 hidden h-dvh w-[72px] flex-col items-center gap-3 py-4 md:flex">
        <Link
          href="/inicio"
          className="grid size-11 place-items-center text-sm font-semibold tracking-wide"
          aria-label="ZEEK"
        >
          ZEEK
        </Link>
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={`grid size-11 place-items-center rounded-full ${active ? "bg-[#f7f7f7] text-[#161616]" : "bg-surface-2 text-fg"}`}
            >
              <Icon size={20} strokeWidth={1.75} />
            </Link>
          );
        })}
        <div className="mt-auto grid gap-3">
          {admin ? (
            <Link
              href="/admin/usuarios"
              aria-label="Admin"
              title="Admin"
              className="bg-surface-2 grid size-11 place-items-center rounded-full"
            >
              <Settings size={18} strokeWidth={1.75} />
            </Link>
          ) : null}
          <Link
            href="/perfil"
            className="bg-violet text-on-violet grid size-11 place-items-center rounded-full text-xs font-semibold"
            aria-label={name}
          >
            {name.slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </aside>
      <div className="md:pl-[72px]">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-28 md:px-10 md:pb-10">
          {children}
        </div>
      </div>
      <nav className="border-line bg-bg fixed inset-x-0 bottom-0 z-20 flex justify-around border-t px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        {moreOpen ? (
          <div className="bg-surface-1 absolute inset-x-3 bottom-[calc(100%+0.5rem)] grid gap-1 rounded-[28px] p-2 shadow-[var(--shadow-float)]">
            {more.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="min-h-11 rounded-full px-4 py-3 text-sm font-medium"
                onClick={() => setMoreOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
        {mobile.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="grid min-h-11 min-w-11 place-items-center"
              aria-label={item.label}
            >
              <span
                className={`grid size-11 place-items-center rounded-full ${active ? "bg-accent text-[#161616]" : ""}`}
              >
                <Icon size={20} strokeWidth={1.75} />
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          className="grid min-h-11 min-w-11 place-items-center"
          aria-label="Más"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span
            className={`grid h-11 min-w-11 place-items-center rounded-full px-3 text-xs font-semibold ${
              more.some((item) => pathname.startsWith(item.href))
                ? "bg-accent text-[#161616]"
                : ""
            }`}
          >
            Más
          </span>
        </button>
      </nav>
    </div>
  );
}
