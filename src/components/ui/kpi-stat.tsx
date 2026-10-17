export function KpiStat({
  label,
  value,
  delta,
  direction,
}: {
  label: string;
  value: string;
  delta?: string;
  direction?: "up" | "down";
}) {
  return (
    <div className="bg-surface-1 border-line shadow-card min-w-0 rounded-[20px] border px-4 py-3.5">
      <p className="text-muted text-[0.8125rem] font-medium">{label}</p>
      <p className="mt-1.5 text-[clamp(1.75rem,3.2vw,2.5rem)] leading-none font-semibold tabular-nums">
        {value}
      </p>
      {delta ? (
        <p
          className={`mt-2.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            direction === "down"
              ? "bg-danger/15 text-[var(--danger-text)]"
              : "bg-accent text-[#161616]"
          }`}
        >
          {direction === "down" ? "▼" : "▲"} {delta}
        </p>
      ) : null}
    </div>
  );
}
