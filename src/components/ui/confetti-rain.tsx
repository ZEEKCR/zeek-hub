"use client";

import { useEffect } from "react";
import { confettiRain } from "@/lib/confetti";

/** Soft confetti for a birthday, once per browser session so it does not repeat on every page. */
export function ConfettiRain() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("zeek-birthday-confetti")) return;
      sessionStorage.setItem("zeek-birthday-confetti", "1");
    } catch {
      // Without storage it just plays each time.
    }
    confettiRain(3);
  }, []);
  return null;
}
