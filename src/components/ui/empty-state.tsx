import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-line bg-surface-1/50 flex flex-col items-center gap-2 rounded-[20px] border border-dashed px-6 py-10 text-center">
      <span className="bg-surface-2 text-muted grid size-12 place-items-center rounded-full">
        {icon}
      </span>
      <p className="font-semibold">{title}</p>
      {hint ? <p className="text-muted max-w-sm text-sm">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
