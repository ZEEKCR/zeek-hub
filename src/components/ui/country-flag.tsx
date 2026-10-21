import { Globe } from "lucide-react";
import { flagRects, FLAGS } from "@/lib/flags";
import { scopeName, type Scope } from "@/server/domain/countries";

/** A small flag for a country, or a globe for "global". */
export function CountryFlag({
  scope,
  size = 18,
  title = true,
}: {
  scope: Scope;
  /** Height in pixels; the flag is 3:2. */
  size?: number;
  title?: boolean;
}) {
  const label = scopeName(scope);
  if (scope === "global") {
    return (
      <Globe
        size={size}
        strokeWidth={1.75}
        role="img"
        aria-label={label}
        className="shrink-0"
      />
    );
  }
  const width = Math.round(size * 1.5);
  const emblem = FLAGS[scope].emblem;
  return (
    <svg
      width={width}
      height={size}
      viewBox={`0 0 ${width} ${size}`}
      role="img"
      aria-label={label}
      className="border-line shrink-0 rounded-[3px] border"
    >
      {title ? <title>{label}</title> : null}
      {flagRects(scope, width, size).map((rect, index) => (
        <rect
          key={index}
          x={rect.x}
          y={rect.y}
          width={rect.width + 0.5}
          height={rect.height + 0.5}
          fill={rect.color}
        />
      ))}
      {emblem ? (
        <circle cx={width / 2} cy={size / 2} r={size * 0.17} fill={emblem} />
      ) : null}
    </svg>
  );
}

export function ScopeBadge({ scope }: { scope: Scope }) {
  return (
    <span className="badge inline-flex items-center gap-1.5">
      <CountryFlag scope={scope} size={14} />
      {scopeName(scope)}
    </span>
  );
}
