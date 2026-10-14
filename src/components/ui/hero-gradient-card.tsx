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
    <section className="text-fg shadow-card overflow-hidden rounded-[32px] bg-[#161616]">
      <div className="relative bg-[linear-gradient(135deg,#6335ED_0%,#3B7BD9_45%,#01E576_100%)] px-6 pt-6 pb-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.25),transparent_45%)] mix-blend-soft-light" />
        <p className="relative text-sm font-medium text-white/80">{kicker}</p>
        <p className="relative max-w-[16rem] text-[clamp(2rem,4vw,3rem)] leading-none font-medium text-white">
          {value}
        </p>
      </div>
      <div className="relative -mt-8 rounded-t-[32px] bg-[#161616] px-6 py-5">
        {children}
      </div>
    </section>
  );
}
