import type { ReactNode } from "react";

export function HeroGradientCard({
  kicker,
  value,
  children,
}: {
  kicker: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <section className="shadow-card overflow-hidden rounded-[28px] bg-[#161616] text-white">
      <div className="aurora relative px-5 pt-5 pb-10 md:px-6 md:pt-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.25),transparent_45%)] mix-blend-soft-light" />
        <p className="relative text-xs font-semibold tracking-[0.08em] text-white/85 uppercase">
          {kicker}
        </p>
        <p className="relative mt-1.5 max-w-[22rem] text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight font-semibold text-white">
          {value}
        </p>
      </div>
      <div className="relative -mt-6 rounded-t-[28px] bg-[#161616] px-5 py-4 md:px-6">
        {children}
      </div>
    </section>
  );
}
