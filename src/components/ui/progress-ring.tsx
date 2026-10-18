/** A small ring that draws itself to the value when it appears. */
export function ProgressRing({
  value,
  size = 44,
}: {
  value: number;
  size?: number;
}) {
  const percent = Math.max(0, Math.min(100, value));
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${percent}% listo`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.18}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - percent / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-draw"
          style={{ ["--ring-len" as string]: length }}
        />
      </svg>
      <span className="absolute text-[0.6875rem] font-semibold tabular-nums">
        {percent}
      </span>
    </span>
  );
}
