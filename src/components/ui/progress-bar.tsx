export function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div
        className="bg-surface-3 h-1.5 flex-1 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance"
      >
        <div
          className="bg-accent bar-fill h-full rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm tabular-nums">{width}%</span>
    </div>
  );
}
