import { teamTone } from "@/lib/team-colors";
import { initials } from "@/lib/utils";

const tones = [
  "bg-violet text-on-violet",
  "bg-[#007A3F] text-white",
  "bg-[#3B7BD9] text-white",
  "bg-surface-3 text-fg",
];

function toneFor(name: string) {
  let total = 0;
  for (const char of name) total += char.charCodeAt(0);
  return tones[total % tones.length];
}

/** The person's department colours the avatar; without one it falls back to a name-based tone. */
export function Avatar({
  name,
  size = "md",
  team,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  team?: string | null | undefined;
}) {
  const box =
    size === "sm"
      ? "size-6 text-[0.625rem]"
      : size === "lg"
        ? "size-14 text-lg"
        : "size-9 text-xs";
  const tone = teamTone(team);
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${box} ${tone ? "text-white" : toneFor(name)}`}
      {...(tone ? { style: { backgroundColor: tone.solid } } : {})}
    >
      {initials(name)}
    </span>
  );
}
