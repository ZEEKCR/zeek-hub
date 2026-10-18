import { prefersReducedMotion } from "@/lib/motion";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
  life: number;
  ttl: number;
  round: boolean;
};

const COLORS = [
  "#01e576",
  "#6335ed",
  "#3b7bd9",
  "#ffb547",
  "#ff7fb0",
  "#ffffff",
];
const GRAVITY = 0.16;

let canvas: HTMLCanvasElement | null = null;
let pieces: Piece[] = [];
let frame = 0;

function ensureCanvas() {
  if (canvas) return canvas;
  const element = document.createElement("canvas");
  element.setAttribute("aria-hidden", "true");
  Object.assign(element.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "60",
  });
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  element.width = Math.round(window.innerWidth * ratio);
  element.height = Math.round(window.innerHeight * ratio);
  document.body.append(element);
  canvas = element;
  return element;
}

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  canvas?.remove();
  canvas = null;
  pieces = [];
}

function draw() {
  const element = canvas;
  const context = element?.getContext("2d");
  if (!element || !context) return stop();
  const ratio = element.width / window.innerWidth;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  pieces = pieces.filter(
    (piece) => piece.life < piece.ttl && piece.y < window.innerHeight + 30,
  );
  for (const piece of pieces) {
    piece.life += 1;
    piece.vy += GRAVITY;
    piece.vx *= 0.99;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rotation += piece.spin;
    context.save();
    context.globalAlpha = Math.min(1, (piece.ttl - piece.life) / 24);
    context.translate(piece.x, piece.y);
    context.rotate(piece.rotation);
    context.fillStyle = piece.color;
    if (piece.round) {
      context.beginPath();
      context.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(
        -piece.size / 2,
        -piece.size / 3,
        piece.size,
        piece.size * 0.66,
      );
    }
    context.restore();
  }
  if (pieces.length === 0) return stop();
  frame = requestAnimationFrame(draw);
}

function start(added: Piece[]) {
  ensureCanvas();
  pieces.push(...added);
  if (!frame) frame = requestAnimationFrame(draw);
}

function piece(
  x: number,
  y: number,
  vx: number,
  vy: number,
  ttl: number,
): Piece {
  return {
    x,
    y,
    vx,
    vy,
    size: 5 + Math.random() * 6,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.35,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#01e576",
    life: 0,
    ttl,
    round: Math.random() < 0.3,
  };
}

/** A burst of confetti from a point of the screen (client coordinates). */
export function confettiBurst(
  origin: { x: number; y: number },
  options: { count?: number; power?: number } = {},
) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  const count = options.count ?? 34;
  const power = options.power ?? 1;
  const added = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95;
    const speed = (4 + Math.random() * 6) * power;
    return piece(
      origin.x,
      origin.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      70 + Math.random() * 50,
    );
  });
  start(added);
}

/** Confetti falling softly from the top for a few seconds. */
export function confettiRain(seconds = 3) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  const waves = Math.round(seconds * 6);
  for (let wave = 0; wave < waves; wave += 1) {
    window.setTimeout(() => {
      start(
        Array.from({ length: 4 }, () =>
          piece(
            Math.random() * window.innerWidth,
            -10,
            (Math.random() - 0.5) * 1.4,
            1 + Math.random() * 1.6,
            200 + Math.random() * 80,
          ),
        ),
      );
    }, wave * 160);
  }
}
