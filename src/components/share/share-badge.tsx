"use client";

import { Check, Copy, Download, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  BADGE_HEIGHT,
  BADGE_WIDTH,
  drawBadge,
  loadBadgeAssets,
  renderBadgeGif,
  renderBadgeJpeg,
  type BadgeAssets,
  type BadgeData,
} from "@/lib/badge-canvas";
import {
  BADGE_MESSAGES,
  badgeCaption,
  badgeFilename,
  badgeHeadline,
  type BadgeFormat,
  type BadgeMessageId,
} from "@/lib/badge";
import { prefersReducedMotion } from "@/lib/motion";

export type ShareBadgeProps = {
  name: string;
  role: string;
  team?: string | undefined;
  teamColor?: string | undefined;
  photoUrl?: string | undefined;
  since?: string | undefined;
};

const LOOP_MS = 2000;

export function ShareBadge(props: ShareBadgeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<BadgeMessageId>("empezando");
  const [format, setFormat] = useState<BadgeFormat>("jpg");
  const [loaded, setLoaded] = useState<{
    key: string;
    assets: BadgeAssets;
  } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const { name, role, team, teamColor, photoUrl, since } = props;
  // The pictures of the current photo; until they arrive the buttons wait.
  const assets =
    loaded && loaded.key === (photoUrl ?? "") ? loaded.assets : null;

  const data: BadgeData = {
    headline: badgeHeadline(message),
    name,
    role,
    ...(team ? { team } : {}),
    ...(teamColor ? { teamColor } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(since ? { since } : {}),
  };

  // Fonts and pictures load once per photo.
  useEffect(() => {
    let cancelled = false;
    loadBadgeAssets({
      headline: "",
      name,
      role,
      ...(photoUrl ? { photoUrl } : {}),
    })
      .then((assets) => {
        if (!cancelled) setLoaded({ key: photoUrl ?? "", assets });
      })
      .catch(() => {
        if (!cancelled) {
          setProblem("No pudimos preparar la imagen. Recarga la página.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [name, role, photoUrl]);

  // The preview: still for JPG, a live loop for GIF.
  const headline = badgeHeadline(message);
  useEffect(() => {
    const element = canvas.current;
    if (!element || !assets) return;
    const live: BadgeData = {
      headline,
      name,
      role,
      ...(team ? { team } : {}),
      ...(teamColor ? { teamColor } : {}),
      ...(since ? { since } : {}),
    };
    const preview = 0.3;
    if (format === "jpg" || prefersReducedMotion()) {
      drawBadge(element, live, assets, { scale: preview });
      return;
    }
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      drawBadge(element, live, assets, {
        scale: preview,
        phase: ((now - started) % LOOP_MS) / LOOP_MS,
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [assets, format, headline, name, role, team, teamColor, since]);

  const caption = badgeCaption(message, { ...(team ? { team } : {}), role });

  async function makeFile() {
    if (!assets) throw new Error("assets");
    setProblem(null);
    if (format === "gif") {
      setProgress(0);
      try {
        const blob = await renderBadgeGif(data, assets, (done, total) =>
          setProgress(Math.round((done / total) * 100)),
        );
        return new File([blob], badgeFilename(name, "gif"), {
          type: "image/gif",
        });
      } finally {
        setProgress(null);
      }
    }
    const blob = await renderBadgeJpeg(data, assets);
    return new File([blob], badgeFilename(name, "jpg"), { type: "image/jpeg" });
  }

  function save(file: File) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function run(action: "download" | "share") {
    try {
      const file = await makeFile();
      if (action === "share" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: caption });
        } catch (error) {
          if ((error as Error).name !== "AbortError") save(file);
        }
        return;
      }
      save(file);
    } catch {
      setProblem("No pudimos crear la imagen. Inténtalo de nuevo.");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setProblem("No pudimos copiar el texto. Selecciónalo y cópialo a mano.");
    }
  }

  const busy = progress !== null || !assets;
  const chip =
    "border-line bg-surface-2 has-[:checked]:bg-inverse has-[:checked]:text-bg cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold";
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-start">
      <canvas
        ref={canvas}
        width={Math.round(BADGE_WIDTH * 0.3)}
        height={Math.round(BADGE_HEIGHT * 0.3)}
        role="img"
        aria-label={`Tu gafete de ZEEK: ${headline}`}
        className="border-line aspect-[4/5] w-full max-w-[15rem] rounded-[20px] border shadow-[var(--shadow-card)]"
      />
      <div className="grid gap-4">
        <fieldset className="grid gap-2">
          <legend className="field-label mb-1">¿Qué quieres decir?</legend>
          <div className="flex flex-wrap gap-2">
            {BADGE_MESSAGES.map((option) => (
              <label key={option.id} className={chip}>
                <input
                  type="radio"
                  name="badge-message"
                  value={option.id}
                  checked={message === option.id}
                  onChange={() => setMessage(option.id)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="field-label mb-1">Formato</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["jpg", "Imagen (JPG)"],
                ["gif", "Mini animación (GIF)"],
              ] as const
            ).map(([id, label]) => (
              <label key={id} className={chip}>
                <input
                  type="radio"
                  name="badge-format"
                  value={id}
                  checked={format === id}
                  onChange={() => setFormat(id)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="bg-surface-2 text-muted rounded-[14px] px-3.5 py-3 text-sm leading-6">
          {caption}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run("share")}
            className="btn btn-primary"
          >
            <Share2 size={16} aria-hidden />
            {progress !== null ? `Creando… ${progress}%` : "Compartir"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("download")}
            className="btn btn-secondary"
          >
            <Download size={16} aria-hidden />
            Descargar {format === "gif" ? "GIF" : "JPG"}
          </button>
          <button type="button" onClick={copy} className="btn btn-secondary">
            {copied ? (
              <Check size={16} aria-hidden />
            ) : (
              <Copy size={16} aria-hidden />
            )}
            {copied ? "Copiado" : "Copiar texto"}
          </button>
        </div>
        {format === "gif" ? (
          <p className="text-muted text-xs">
            El GIF es una versión pequeña (540 × 675) que se mueve en bucle.
            Funciona en WhatsApp, X, Facebook y LinkedIn. Instagram no acepta
            GIF en publicaciones: ahí usa el JPG.
          </p>
        ) : null}
        {problem ? (
          <p role="alert" className="badge badge-danger w-fit">
            {problem}
          </p>
        ) : null}
      </div>
    </div>
  );
}
