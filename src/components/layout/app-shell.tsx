"use client";

import {
  CalendarDays,
  Home,
  KanbanSquare,
  Library,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
        <Link
          href="/perfil"
          className="bg-violet text-on-violet mt-auto grid size-11 place-items-center rounded-full text-xs font-semibold"
          aria-label={name}
        >
          {name.slice(0, 1).toUpperCase()}
        </Link>
      </aside>
      <div className="md:pl-[72px]">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-28 md:px-10 md:pb-10">
          {children}
        </div>
      </div>
      <nav className="border-line bg-bg fixed inset-x-0 bottom-0 z-20 flex justify-around border-t px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
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
        <Link
          href={admin ? "/admin/usuarios" : "/perfil"}
          className="grid min-h-11 min-w-11 place-items-center"
          aria-label="Más"
        >
          <span className="text-xs font-semibold">Más</span>
        </Link>
      </nav>
    </div>
  );
}
