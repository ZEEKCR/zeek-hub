"use client";

import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Shows the final value in the HTML, then counts up to it in the browser.
 * "67%" and "4.5" work too: the number is animated and the rest is kept.
 */
export function CountUp({
  value,
  duration = 900,
}: {
  value: string;
  duration?: number;
}) {
  const node = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = node.current;
    const match = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(value);
    if (!element || !match || prefersReducedMotion()) return;
    const target = Number(match[1]);
    const suffix = match[2] ?? "";
    const decimals = match[1]?.split(".")[1]?.length ?? 0;
    const show = (number: number) => `${number.toFixed(decimals)}${suffix}`;
    const started = performance.now();
    let frame = 0;
    element.textContent = show(0);
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      element.textContent = show(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      element.textContent = value;
    };
  }, [value, duration]);

  return <span ref={node}>{value}</span>;
}
