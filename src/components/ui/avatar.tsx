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

/**
 * A photo wins when the person uploaded one. Otherwise their department
 * colours the initials, and without one it falls back to a name-based tone.
 */
export function Avatar({
  name,
  size = "md",
  team,
  photo,
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  team?: string | null | undefined;
  photo?: string | undefined;
}) {
  const box =
    size === "sm"
      ? "size-6 text-[0.625rem]"
      : size === "lg"
        ? "size-14 text-lg"
        : size === "xl"
          ? "size-24 text-3xl"
          : "size-9 text-xs";
  if (photo) {
    return (
      // A small private JPEG served by our own route, so next/image adds nothing.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        aria-hidden
        className={`shrink-0 rounded-full object-cover ${box}`}
      />
    );
  }
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
