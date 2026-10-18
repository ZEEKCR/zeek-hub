import { teamTone } from "@/lib/team-colors";
import { initials } from "@/lib/utils";

const tones = [
  "bg-violet text-on-violet",
  "bg-[#007A3F] text-white",
  "bg-surface-3 text-fg",
];

export function AvatarStack({
  names,
  teams = [],
}: {
  names: string[];
  /** Optional department per name, same order as `names`. */
  teams?: (string | null | undefined)[];
}) {
  const teamOf = new Map<string, string | null | undefined>();
  names.forEach((name, index) => {
    if (!teamOf.has(name)) teamOf.set(name, teams[index]);
  });
  const unique = [...new Set(names.filter((name) => name.trim()))];
  const shown = unique.slice(0, 3);
  const extra = unique.length - shown.length;
  const label =
    extra > 0 ? `${shown.join(", ")} y ${extra} más` : unique.join(", ");
  return (
    <div className="group/stack flex items-center" aria-label={label}>
      {shown.map((name, index) => {
        const tone = teamTone(teamOf.get(name));
        return (
          <span
            key={name}
            className={`grid size-8 place-items-center rounded-full text-xs font-semibold ring-2 ring-[var(--surface-1)] ${tone ? "text-white" : tones[index % tones.length]} ${index > 0 ? "-ml-2 transition-[margin] duration-300 group-hover/stack:ml-0.5" : ""}`}
            {...(tone ? { style: { backgroundColor: tone.solid } } : {})}
          >
            {initials(name)}
          </span>
        );
      })}
      {extra > 0 ? (
        <span className="bg-surface-2 -ml-2 grid size-8 place-items-center rounded-full text-xs font-semibold ring-2 ring-[var(--surface-1)]">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
