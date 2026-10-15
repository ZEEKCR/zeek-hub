import { initials } from "@/lib/utils";

const tones = [
  "bg-violet text-on-violet",
  "bg-[#007A3F] text-white",
  "bg-surface-3 text-fg",
];

export function AvatarStack({ names }: { names: string[] }) {
  const unique = [...new Set(names.filter((name) => name.trim()))];
  const shown = unique.slice(0, 3);
  const extra = unique.length - shown.length;
  const label =
    extra > 0 ? `${shown.join(", ")} y ${extra} más` : unique.join(", ");
  return (
    <div className="flex items-center" aria-label={label}>
      {shown.map((name, index) => (
        <span
          key={name}
          className={`grid size-8 place-items-center rounded-full text-xs font-semibold ring-2 ring-[var(--surface-1)] ${tones[index % tones.length]} ${index > 0 ? "-ml-2" : ""}`}
        >
          {initials(name)}
        </span>
      ))}
      {extra > 0 ? (
        <span className="bg-surface-2 -ml-2 grid size-8 place-items-center rounded-full text-xs font-semibold ring-2 ring-[var(--surface-1)]">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
