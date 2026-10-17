import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="note"
      className="border-line bg-surface-1 text-muted flex items-start gap-3 rounded-[16px] border px-4 py-3 text-sm"
    >
      <Info
        size={16}
        className="text-violet-text mt-0.5 shrink-0"
        aria-hidden
      />
      <span>{children}</span>
    </p>
  );
}
