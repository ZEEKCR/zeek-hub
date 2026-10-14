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
    <div className="bg-surface-1 shadow-card min-w-36 rounded-[20px] px-4 py-3">
      <p className="text-[clamp(2rem,4vw,3rem)] leading-none font-medium tabular-nums">
        {value}
      </p>
      <p className="text-muted mt-2 text-[0.8125rem] font-medium">{label}</p>
      {delta ? (
        <p
          className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            direction === "down"
              ? "bg-danger/15 text-danger"
              : "bg-accent text-[#161616]"
          }`}
        >
          {direction === "down" ? "▼" : "▲"} {delta}
        </p>
      ) : null}
    </div>
  );
}
