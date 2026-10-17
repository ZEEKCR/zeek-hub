import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  kicker,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  kicker?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {kicker ? <p className="eyebrow mb-1.5">{kicker}</p> : null}
        <h1 className="text-3xl leading-tight font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted mt-1.5 max-w-2xl text-sm md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
