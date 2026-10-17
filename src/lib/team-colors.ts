import { foldName } from "@/server/domain/assignee";

export type Tone = { solid: string; soft: string };

/** One colour per department; text on `solid` is white (contrast 5:1 or more). */
const TEAM_TONES: Record<string, Tone> = {
  growth: { solid: "#007A3F", soft: "#01e576" },
  operations: { solid: "#6335ED", soft: "#9f86f7" },
  communications: { solid: "#C2185B", soft: "#ff7fb0" },
  technical: { solid: "#1F5FBF", soft: "#6aa5ff" },
  logistics: { solid: "#B45309", soft: "#ffb547" },
};

const FALLBACK: Tone = { solid: "#4B5563", soft: "#9ca3af" };

/** Accepts a team id (`team-growth`) or its name (`Growth`). */
export function teamTone(team: string | null | undefined): Tone | null {
  if (!team) return null;
  const key = foldName(team).replace(/^team\s+/, "");
  return TEAM_TONES[key] ?? null;
}

export function teamToneOrFallback(team: string | null | undefined) {
  return teamTone(team) ?? FALLBACK;
}
