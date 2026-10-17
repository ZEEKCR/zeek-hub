"use client";

import { useEffect } from "react";

/** Registers the service worker once, in production builds only. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installation is optional; the app works the same without it.
    });
  }, []);
  return null;
}
