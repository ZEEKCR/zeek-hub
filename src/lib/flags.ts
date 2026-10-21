import type { CountryId } from "@/server/domain/countries";

/**
 * Simplified flags: only the stripes and, for Mexico, a dot where the emblem
 * goes. The same description draws the SVG in the app and the canvas in the
 * badge, so a flag looks the same on every device (Windows has no flag emoji).
 */
export type FlagSpec = {
  direction: "horizontal" | "vertical";
  stripes: { color: string; weight: number }[];
  emblem?: string;
};

export const FLAGS: Record<CountryId, FlagSpec> = {
  cr: {
    direction: "horizontal",
    stripes: [
      { color: "#002b7f", weight: 1 },
      { color: "#ffffff", weight: 1 },
      { color: "#ce1126", weight: 2 },
      { color: "#ffffff", weight: 1 },
      { color: "#002b7f", weight: 1 },
    ],
  },
  mx: {
    direction: "vertical",
    stripes: [
      { color: "#006847", weight: 1 },
      { color: "#ffffff", weight: 1 },
      { color: "#ce1126", weight: 1 },
    ],
    emblem: "#8a6a2f",
  },
  sv: {
    direction: "horizontal",
    stripes: [
      { color: "#0f47af", weight: 1 },
      { color: "#ffffff", weight: 1 },
      { color: "#0f47af", weight: 1 },
    ],
  },
  co: {
    direction: "horizontal",
    stripes: [
      { color: "#fcd116", weight: 2 },
      { color: "#003893", weight: 1 },
      { color: "#ce1126", weight: 1 },
    ],
  },
};

/** Rectangles of each stripe on a width × height flag. */
export function flagRects(country: CountryId, width: number, height: number) {
  const spec = FLAGS[country];
  const total = spec.stripes.reduce((sum, stripe) => sum + stripe.weight, 0);
  let offset = 0;
  return spec.stripes.map((stripe) => {
    const share = stripe.weight / total;
    const rect =
      spec.direction === "horizontal"
        ? { x: 0, y: offset * height, width, height: share * height }
        : { x: offset * width, y: 0, width: share * width, height };
    offset += share;
    return { ...rect, color: stripe.color };
  });
}

/** Draws the flag with its top-left corner at (x, y), with rounded corners. */
export function drawFlag(
  ctx: CanvasRenderingContext2D,
  country: CountryId,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 6,
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  for (const rect of flagRects(country, width, height)) {
    ctx.fillStyle = rect.color;
    ctx.fillRect(x + rect.x, y + rect.y, rect.width + 0.5, rect.height + 0.5);
  }
  const emblem = FLAGS[country].emblem;
  if (emblem) {
    ctx.fillStyle = emblem;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, height * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.stroke();
}
