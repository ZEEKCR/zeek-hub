"use client";

import {
  CalendarDays,
  Home,
  KanbanSquare,
  Library,
  Menu,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CommandPalette } from "@/components/layout/command-palette";
import { Avatar } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

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
  teamId,
  photo,
  admin,
}: {
  children: ReactNode;
  name: string;
  teamId: string | null;
  photo?: string | undefined;
  admin: boolean;
}) {
  const pathname = usePathname();
  const mobile = items.slice(0, 4);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  const profileActive =
    pathname.startsWith("/perfil") || pathname.startsWith("/ayuda");
  const more = [
    { href: "/equipos", label: "Equipos" },
    { href: "/recursos", label: "Recursos" },
    { href: "/perfil", label: "Perfil" },
    ...(admin ? [{ href: "/admin/usuarios", label: "Admin" }] : []),
  ];
  const moreActive =
    more.some((item) => pathname.startsWith(item.href)) || profileActive;
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
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar"
          title="Buscar (Ctrl+K)"
          className="text-muted hover:bg-surface-2 hover:text-fg mx-2 mb-2 grid w-[calc(100%-1rem)] justify-items-center gap-1 rounded-2xl px-1 py-2 text-[0.6875rem] font-semibold transition-colors"
        >
          <Search size={20} strokeWidth={1.75} />
          Buscar
        </button>
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
              className={`rounded-full ${
                profileActive
                  ? "ring-accent ring-2 ring-offset-2 ring-offset-[var(--bg)]"
                  : ""
              }`}
            >
              <Avatar name={name} team={teamId} photo={photo} />
            </span>
            <span className="text-muted group-hover:text-fg">Perfil</span>
          </Link>
        </div>
      </aside>
      <div className="md:pl-[88px]">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-32 md:px-8 md:pt-8 md:pb-10 xl:px-10">
          <header className="mb-5 flex items-center justify-between md:hidden">
            <Link
              href="/inicio"
              aria-label="ZEEK"
              className="inline-flex items-center"
            >
              <BrandLogo className="h-9 w-auto" />
            </Link>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
              className="bg-surface-1 border-line grid size-10 place-items-center rounded-full border"
            >
              <Search size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </header>
          <CommandPalette open={searchOpen} onClose={closeSearch} />
          {children}
        </div>
      </div>
      <nav
        aria-label="Principal móvil"
        className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 md:hidden"
      >
        {moreOpen ? (
          <>
            <button
              type="button"
              aria-label="Cerrar menú"
              className="pointer-events-auto fixed inset-0 -z-10 cursor-default"
              onClick={() => setMoreOpen(false)}
            />
            <div className="pop bg-surface-1 border-line pointer-events-auto absolute inset-x-0 bottom-[calc(100%+0.75rem)] grid gap-1 rounded-[24px] border p-2 shadow-[var(--shadow-float)]">
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
        <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-full border border-white/10 bg-[#0f1116] p-1.5 shadow-[0_12px_32px_rgb(0_0_0/0.35)]">
          {mobile.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`grid size-12 place-items-center rounded-full transition-all duration-300 ${
                  active
                    ? "scale-100 bg-white text-[#0f1116]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Icon size={21} strokeWidth={1.75} />
              </Link>
            );
          })}
          <button
            type="button"
            aria-label="Más"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
            className={`grid size-12 place-items-center rounded-full transition-all duration-300 ${
              moreActive
                ? "bg-white text-[#0f1116]"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Menu size={21} strokeWidth={1.75} />
          </button>
        </div>
      </nav>
    </div>
  );
}
