"use client";

import QRCode from "qrcode";
import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type TicketData = {
  name: string;
  username: string;
  department: string;
  jobTitle?: string;
  password: string;
  loginUrl: string;
};

const W = 1080;
const H = 1620;
const TX = 150;
const TW = 780;
const TY = 110;
const TH = 1400;
const PAD = 60;

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
  while (ctx.measureText(text).width > maxWidth && current > 14) {
    current -= 1;
    ctx.font = `${weight} ${current}px ${family}`;
  }
}

export async function renderTicket(
  canvas: HTMLCanvasElement,
  data: TicketData,
) {
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  await Promise.all([
    document.fonts.load(`700 40px ${family}`),
    document.fonts.load(`500 28px ${family}`),
  ]).catch(() => undefined);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no puede dibujar el ticket.");
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, W, H);

  // Striped header, in the ZEEK gradient.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(TX, TY, TW, 230, 44);
  ctx.clip();
  const band = ctx.createLinearGradient(TX, TY, TX + TW, TY);
  band.addColorStop(0, "#01e576");
  band.addColorStop(1, "#6335ed");
  ctx.fillStyle = "#14102a";
  ctx.fillRect(TX, TY, TW, 230);
  ctx.fillStyle = band;
  for (let x = TX - 260; x < TX + TW + 260; x += 78) {
    ctx.beginPath();
    ctx.moveTo(x, TY);
    ctx.lineTo(x + 40, TY);
    ctx.lineTo(x + 40 - 230, TY + 230);
    ctx.lineTo(x - 230, TY + 230);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // White body with the perforation notches.
  const bodyTop = TY + 150;
  const perforation = TY + 940;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(TX, bodyTop, TW, TH - 150, 44);
  ctx.fill();
  ctx.fillStyle = "#0b0b0b";
  for (const x of [TX, TX + TW]) {
    ctx.beginPath();
    ctx.arc(x, perforation, 40, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#c9c9d1";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(TX + 50, perforation);
  ctx.lineTo(TX + TW - 50, perforation);
  ctx.stroke();
  ctx.setLineDash([]);

  // Brand row.
  const left = TX + PAD;
  const right = TX + TW - PAD;
  let y = bodyTop + 54;
  const mark = await loadImage("/brand/zeek-mark.png");
  const markHeight = 70;
  ctx.drawImage(
    mark,
    left,
    y,
    (markHeight * mark.width) / mark.height,
    markHeight,
  );
  ctx.fillStyle = "#14102a";
  ctx.textBaseline = "middle";
  ctx.font = `700 38px ${family}`;
  ctx.fillText("ZEEK Hub", left + 70, y + markHeight / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = "#8a8a99";
  ctx.font = `600 26px ${family}`;
  ctx.fillText("Voluntariado", right, y + markHeight / 2);
  ctx.textAlign = "left";

  y += markHeight + 34;
  const divider = (at: number) => {
    ctx.fillStyle = "#e7e7ee";
    ctx.fillRect(left, at, right - left, 2);
  };
  divider(y);

  // Welcome.
  y += 40;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#8a8a99";
  ctx.font = `600 28px ${family}`;
  ctx.fillText("Welcome to ZEEK", left, y + 22);
  y += 40;
  ctx.fillStyle = "#0b0b0b";
  fit(ctx, data.name, right - left, 68, 700, family);
  ctx.fillText(data.name, left, y + 62);
  y += 100;
  ctx.fillStyle = "#6335ed";
  fit(
    ctx,
    data.jobTitle ? `${data.department} · ${data.jobTitle}` : data.department,
    right - left,
    36,
    600,
    family,
  );
  ctx.fillText(
    data.jobTitle ? `${data.department} · ${data.jobTitle}` : data.department,
    left,
    y + 30,
  );
  y += 66;
  divider(y);

  // Credentials.
  const field = (label: string, value: string, at: number, mono = false) => {
    ctx.fillStyle = "#8a8a99";
    ctx.font = `600 24px ${family}`;
    ctx.fillText(label, left, at);
    ctx.fillStyle = "#0b0b0b";
    const face = mono
      ? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
      : family;
    fit(ctx, value, right - left, mono ? 44 : 40, mono ? 700 : 700, face);
    ctx.fillText(value, left, at + 50);
  };
  field("Usuario", `@${data.username}`, y + 52);
  field("Contraseña temporal", data.password, y + 156, true);
  field("Enlace", data.loginUrl.replace(/^https?:\/\//, ""), y + 260);

  // QR under the perforation.
  const qr = await QRCode.toDataURL(data.loginUrl, {
    margin: 1,
    width: 360,
    color: { dark: "#0b0b0b", light: "#ffffff" },
  });
  const qrImage = await loadImage(qr);
  const size = 280;
  ctx.drawImage(qrImage, TX + (TW - size) / 2, perforation + 52, size, size);
  ctx.textAlign = "center";
  ctx.fillStyle = "#0b0b0b";
  ctx.font = `600 28px ${family}`;
  ctx.fillText(
    "Escanea para entrar",
    TX + TW / 2,
    perforation + 52 + size + 44,
  );
  ctx.fillStyle = "#8a8a99";
  ctx.font = `500 22px ${family}`;
  ctx.fillText(
    "La contraseña vence en 72 horas y se cambia al entrar.",
    TX + TW / 2,
    perforation + 52 + size + 80,
  );
  ctx.textAlign = "left";
}

export function WelcomeTicket({ data }: { data: TicketData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError(null);
    renderTicket(canvas, data).catch((reason: unknown) =>
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo crear el ticket.",
      ),
    );
  }, [data]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ticket-zeek-${data.username}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
      },
      "image/jpeg",
      0.93,
    );
  }

  return (
    <div className="grid gap-3">
      <canvas
        ref={canvasRef}
        aria-label={`Ticket de bienvenida de ${data.name}`}
        role="img"
        className="border-line mx-auto w-full max-w-xs rounded-[20px] border"
      />
      {error ? (
        <p role="alert" className="badge badge-danger w-fit text-sm">
          {error}
        </p>
      ) : null}
      <button type="button" onClick={download} className="btn btn-secondary">
        <Download size={16} aria-hidden />
        Descargar ticket (JPG)
      </button>
      <p className="text-muted text-xs">
        El ticket incluye la contraseña temporal. Compártelo solo con la persona
        y no se guarda en el servidor.
      </p>
    </div>
  );
}
