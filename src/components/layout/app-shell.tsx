"use client";

import {
  CalendarDays,
  Home,
  KanbanSquare,
  Library,
  Menu,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
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
  const profileActive =
    pathname.startsWith("/perfil") || pathname.startsWith("/ayuda");
  const more = [
    { href: "/equipos", label: "Equipos" },
    { href: "/recursos", label: "Recursos" },
    { href: "/perfil", label: "Perfil" },
    ...(admin ? [{ href: "/admin/usuarios", label: "Admin" }] : []),
  ];
  return (
    <div className="bg-bg text-fg min-h-dvh">
      <aside className="border-line bg-bg/70 fixed top-0 left-0 z-10 hidden h-dvh w-[88px] flex-col items-center gap-1 border-r py-4 backdrop-blur-xl md:flex">
        <Link
          href="/inicio"
          className="mb-4 grid place-items-center rounded-2xl p-2 transition-opacity hover:opacity-80"
          aria-label="ZEEK"
        >
          <Image
            src="/brand/zeek-mark.png"
            alt=""
            width={182}
            height={240}
            priority
            className="h-10 w-auto"
          />
        </Link>
        <nav aria-label="Principal" className="grid w-full gap-1 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={`group grid justify-items-center gap-1 rounded-2xl px-1 py-2 text-[0.6875rem] font-semibold transition-colors ${
                  active
                    ? "bg-inverse text-bg shadow-[var(--shadow-card)]"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto grid w-full gap-1 px-2">
          {admin ? (
            <Link
              href="/admin/usuarios"
              aria-label="Admin"
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              title="Admin"
              className={`grid justify-items-center gap-1 rounded-2xl px-1 py-2 text-[0.6875rem] font-semibold transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-inverse text-bg"
                  : "text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              <Settings size={18} strokeWidth={1.75} />
              Admin
            </Link>
          ) : null}
          <Link
            href="/perfil"
            className="group grid justify-items-center gap-1 rounded-2xl px-1 py-2 text-[0.6875rem] font-semibold"
            aria-label={name}
            aria-current={profileActive ? "page" : undefined}
            title="Perfil"
          >
            <span
              className={`bg-violet text-on-violet grid size-9 place-items-center rounded-full text-xs font-semibold ${
                profileActive
                  ? "ring-accent ring-2 ring-offset-2 ring-offset-[var(--bg)]"
                  : ""
              }`}
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-muted group-hover:text-fg">Perfil</span>
          </Link>
        </div>
      </aside>
      <div className="md:pl-[88px]">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10 xl:px-10">
          <header className="mb-5 md:hidden">
            <Link
              href="/inicio"
              aria-label="ZEEK"
              className="inline-flex items-center"
            >
              <BrandLogo className="h-9 w-auto" />
            </Link>
          </header>
          {children}
        </div>
      </div>
      <nav
        aria-label="Principal móvil"
        className="border-line bg-bg/80 fixed inset-x-0 bottom-0 z-20 flex justify-around border-t px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
      >
        {moreOpen ? (
          <>
            <button
              type="button"
              aria-label="Cerrar menú"
              className="fixed inset-0 -z-10 cursor-default"
              onClick={() => setMoreOpen(false)}
            />
            <div className="pop bg-surface-1 border-line absolute inset-x-3 bottom-[calc(100%+0.5rem)] grid gap-1 rounded-[24px] border p-2 shadow-[var(--shadow-float)]">
              {more.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hover:bg-surface-2 min-h-11 rounded-full px-4 py-3 text-sm font-medium ${
                    pathname.startsWith(item.href) ? "bg-surface-2" : ""
                  }`}
                  onClick={() => setMoreOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        ) : null}
        {mobile.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="grid min-h-12 min-w-14 place-items-center gap-0.5 text-[0.625rem] font-semibold"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`grid h-8 w-14 place-items-center rounded-full ${active ? "bg-accent text-[#161616]" : "text-muted"}`}
              >
                <Icon size={19} strokeWidth={1.75} />
              </span>
              <span className={active ? "text-fg" : "text-muted"}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          className="grid min-h-12 min-w-14 place-items-center gap-0.5 text-[0.625rem] font-semibold"
          aria-label="Más"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span
            className={`grid h-8 w-14 place-items-center rounded-full ${
              more.some((item) => pathname.startsWith(item.href)) ||
              profileActive
                ? "bg-accent text-[#161616]"
                : "text-muted"
            }`}
          >
            <Menu size={19} strokeWidth={1.75} />
          </span>
          <span className="text-muted">Más</span>
        </button>
      </nav>
    </div>
  );
}
