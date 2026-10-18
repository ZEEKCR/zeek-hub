"use client";

import { ArrowUpRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NotchedCard({
  children,
  active = false,
  actionLabel,
  href,
  accent,
}: {
  children: ReactNode;
  active?: boolean;
  actionLabel: string;
  href?: string;
  /** Colour of the glow under the card on hover, for example the team colour. */
  accent?: string;
}) {
  const actionClass = cn(
    "absolute top-2 right-2 grid size-10 place-items-center rounded-full",
    active ? "bg-[#161616] text-accent" : "bg-surface-2 text-fg",
  );
  return (
    <article
      className={cn(
        "spotlight glow-card relative",
        active && "shadow-accent-glow",
      )}
      style={accent ? ({ ["--glow"]: accent } as CSSProperties) : undefined}
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--mx",
          `${event.clientX - box.left}px`,
        );
        event.currentTarget.style.setProperty(
          "--my",
          `${event.clientY - box.top}px`,
        );
      }}
    >
      <div
        className={cn(
          "shadow-card relative min-h-36 rounded-[28px] p-5 pr-16 motion-safe:transition motion-safe:hover:-translate-y-0.5",
          active ? "bg-accent text-[#161616]" : "bg-surface-1 text-fg",
        )}
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 68px) 0, calc(100% - 68px) 14px, calc(100% - 48px) 14px, calc(100% - 28px) 34px, calc(100% - 28px) 56px, 100% 56px, 100% 100%, 0 100%)",
        }}
      >
        <span
          aria-hidden
          className="spotlight-glow pointer-events-none absolute inset-0"
        />
        {children}
      </div>
      {href ? (
        <a className={actionClass} href={href} aria-label={actionLabel}>
          <ArrowUpRight size={18} strokeWidth={1.75} />
        </a>
      ) : (
        <button type="button" className={actionClass} aria-label={actionLabel}>
          <ArrowUpRight size={18} strokeWidth={1.75} />
        </button>
      )}
    </article>
  );
}
