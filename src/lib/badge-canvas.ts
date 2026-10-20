import { initials } from "@/lib/utils";

export const BADGE_WIDTH = 1080;
export const BADGE_HEIGHT = 1350;

export type BadgeData = {
  headline: string;
  name: string;
  role: string;
  team?: string;
  /** Solid colour of the department, used for the initials and the team pill. */
  teamColor?: string;
  photoUrl?: string;
  since?: string;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = src;
  });
}

function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  weight: number,
  family: string,
) {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && current > 18) {
    current -= 1;
    ctx.font = `${weight} ${current}px ${family}`;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export type BadgeAssets = {
  family: string;
  logo: HTMLImageElement;
  photo: HTMLImageElement | null;
};

/** Loads the fonts and pictures once, so many frames can be drawn quickly. */
export async function loadBadgeAssets(data: BadgeData): Promise<BadgeAssets> {
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  await Promise.all([
    document.fonts.load(`700 40px ${family}`),
    document.fonts.load(`500 28px ${family}`),
  ]).catch(() => undefined);
  const logo = await loadImage("/brand/zeek-logo.png");
  const photo = data.photoUrl
    ? await loadImage(data.photoUrl).catch(() => null)
    : null;
  return { family, logo, photo };
}

/**
 * Draws the badge: headline, then a lanyard card with the person on it.
 * `scale` shrinks the whole picture (the GIF is smaller than the JPG).
 * `phase` (0 to 1) drives the animation: the card sways, light sweeps across
 * it and the bars breathe. Phase 0 is the still picture, and the loop is seamless.
 */
export function drawBadge(
  canvas: HTMLCanvasElement,
  data: BadgeData,
  assets: BadgeAssets,
  options: { scale?: number; phase?: number } = {},
) {
  const scale = options.scale ?? 1;
  const phase = options.phase ?? 0;
  const animated = options.phase !== undefined;
  const wave = Math.sin(phase * Math.PI * 2);
  const { family, logo, photo } = assets;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("El navegador no puede dibujar la imagen.");
  canvas.width = Math.round(BADGE_WIDTH * scale);
  canvas.height = Math.round(BADGE_HEIGHT * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const W = BADGE_WIDTH;
  const H = BADGE_HEIGHT;

  // Background: dark, with violet and green light like the login art.
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  const drift = animated ? wave * 60 : 0;
  const violet = ctx.createRadialGradient(
    W * 0.95 - drift,
    drift,
    0,
    W * 0.95 - drift,
    drift,
    700,
  );
  violet.addColorStop(0, "rgba(99,53,237,0.85)");
  violet.addColorStop(1, "rgba(99,53,237,0)");
  ctx.fillStyle = violet;
  ctx.fillRect(0, 0, W, H);
  const green = ctx.createRadialGradient(
    drift,
    H - drift,
    0,
    drift,
    H - drift,
    760,
  );
  green.addColorStop(0, "rgba(1,229,118,0.55)");
  green.addColorStop(1, "rgba(1,229,118,0)");
  ctx.fillStyle = green;
  ctx.fillRect(0, 0, W, H);
  // Soft bars at the bottom, the same idea as the sign-in screen.
  const bars = [0.34, 0.5, 0.4, 0.66, 0.46, 0.58, 0.36];
  const barWidth = W / bars.length;
  bars.forEach((height, index) => {
    const breathe = animated
      ? 1 + 0.14 * Math.sin(phase * Math.PI * 2 + index * 0.9)
      : 1;
    const top = H - H * 0.34 * height * 1.6 * breathe;
    const gradient = ctx.createLinearGradient(0, H, 0, top);
    gradient.addColorStop(0, "rgba(214,255,233,0.55)");
    gradient.addColorStop(0.3, "rgba(1,229,118,0.35)");
    gradient.addColorStop(1, "rgba(99,53,237,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(index * barWidth + 2, top, barWidth - 4, H - top);
  });

  // Logo and headline.
  const logoHeight = 74;
  ctx.drawImage(
    logo,
    80,
    78,
    (logo.width / logo.height) * logoHeight,
    logoHeight,
  );
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 82px ${family}`;
  const lines = wrap(ctx, data.headline, W - 160).slice(0, 3);
  lines.forEach((line, index) => ctx.fillText(line, 80, 250 + index * 94));

  // The lanyard card. It hangs from the slot, so it sways around the top.
  const cardW = 640;
  const cardH = 700;
  const cx = W / 2;
  const cy = 870;
  const sway = ((-3 + (animated ? 2.6 * wave : 0)) * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy - cardH / 2 + 48);
  ctx.rotate(sway);
  ctx.translate(0, cardH / 2 - 48);
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 48);
  ctx.fill();
  ctx.shadowColor = "transparent";

  // Gradient header with the slot for the lanyard.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-cardW / 2, -cardH / 2, cardW, 150, [48, 48, 0, 0]);
  ctx.clip();
  const header = ctx.createLinearGradient(-cardW / 2, 0, cardW / 2, 0);
  header.addColorStop(0, "#01e576");
  header.addColorStop(1, "#6335ed");
  ctx.fillStyle = header;
  ctx.fillRect(-cardW / 2, -cardH / 2, cardW, 150);
  ctx.restore();
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.roundRect(-70, -cardH / 2 + 34, 140, 28, 14);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `700 26px ${family}`;
  ctx.textAlign = "center";
  ctx.fillText("VOLUNTARIADO ZEEK", 0, -cardH / 2 + 118);

  // Photo, or initials in the team colour.
  const photoCy = -cardH / 2 + 150 + 150;
  const radius = 120;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, photoCy, radius, 0, Math.PI * 2);
  ctx.clip();
  if (photo) {
    ctx.drawImage(photo, -radius, photoCy - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = data.teamColor ?? "#6335ed";
    ctx.fillRect(-radius, photoCy - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 110px ${family}`;
    ctx.textBaseline = "middle";
    ctx.fillText(initials(data.name), 0, photoCy + 6);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = data.teamColor ?? "#6335ed";
  ctx.beginPath();
  ctx.arc(0, photoCy, radius + 6, 0, Math.PI * 2);
  ctx.stroke();

  // Name, role, team and date.
  ctx.fillStyle = "#14102a";
  fit(ctx, data.name, cardW - 80, 58, 700, family);
  ctx.fillText(data.name, 0, photoCy + radius + 86);
  ctx.fillStyle = "#5b5b66";
  fit(ctx, data.role, cardW - 80, 34, 500, family);
  ctx.fillText(data.role, 0, photoCy + radius + 136);
  let pillBottom = photoCy + radius + 136;
  if (data.team) {
    ctx.font = `700 30px ${family}`;
    const width = ctx.measureText(data.team).width + 64;
    ctx.fillStyle = data.teamColor ?? "#6335ed";
    ctx.beginPath();
    ctx.roundRect(-width / 2, pillBottom + 26, width, 58, 29);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.team, 0, pillBottom + 66);
    pillBottom += 84;
  }
  if (data.since) {
    ctx.fillStyle = "#8a8a96";
    ctx.font = `500 26px ${family}`;
    ctx.fillText(`Desde ${data.since}`, 0, pillBottom + 56);
  }

  // A band of light that sweeps across the card once per loop.
  if (animated) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 48);
    ctx.clip();
    const x = -cardW + phase * cardW * 2.4;
    const shine = ctx.createLinearGradient(
      x - 120,
      -cardH / 2,
      x + 120,
      cardH / 2,
    );
    shine.addColorStop(0, "rgba(255,255,255,0)");
    shine.addColorStop(0.5, "rgba(255,255,255,0.38)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
    ctx.restore();
  }
  ctx.restore();

  // Footer.
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `600 34px ${family}`;
  ctx.fillText("The Future Is Built Together", W / 2, H - 52);
  ctx.textAlign = "left";
}

/** The still picture, as a JPG (it has no transparent parts, so nothing is lost). */
export async function renderBadgeJpeg(data: BadgeData, assets: BadgeAssets) {
  const canvas = document.createElement("canvas");
  drawBadge(canvas, data, assets);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("No se pudo crear la imagen.");
  return blob;
}

export const GIF_SCALE = 0.5;
export const GIF_FRAMES = 24;
const GIF_DELAY_MS = 80;

/** A small looping GIF (540 × 675): the same badge with the card swaying and light sweeping across it. */
export async function renderBadgeGif(
  data: BadgeData,
  assets: BadgeAssets,
  onProgress?: (done: number, total: number) => void,
) {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const canvas = document.createElement("canvas");
  const encoder = GIFEncoder();
  for (let frame = 0; frame < GIF_FRAMES; frame += 1) {
    drawBadge(canvas, data, assets, {
      scale: GIF_SCALE,
      phase: frame / GIF_FRAMES,
    });
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("canvas");
    const { data: rgba } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(rgba, 256);
    encoder.writeFrame(
      applyPalette(rgba, palette),
      canvas.width,
      canvas.height,
      {
        palette,
        delay: GIF_DELAY_MS,
        repeat: 0,
      },
    );
    onProgress?.(frame + 1, GIF_FRAMES);
    // Let the page breathe between frames so the screen does not freeze.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  encoder.finish();
  return new Blob([new Uint8Array(encoder.bytes())], { type: "image/gif" });
}
