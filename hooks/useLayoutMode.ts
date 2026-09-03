"use client";

import { useLayoutEffect, useState } from "react";

import { NARROW_W } from "@/lib/narrow-stage";

export type LayoutMode = "desktop" | "narrow";

const NARROW_MQ =
  `(max-width: ${NARROW_W}px), (max-width: 1023px) and (orientation: portrait)`;

function isPhone() {
  if (typeof window === "undefined") return false;
  const shortest = Math.min(screen.width, screen.height);
  if (shortest <= 500) return true;
  return /iPhone|iPod|Android.+Mobile/i.test(navigator.userAgent);
}

function readLayoutMode(): LayoutMode {
  if (typeof window === "undefined") return "desktop";
  // iPhone "Request Desktop Website" inflates innerWidth; screen size does not.
  if (isPhone()) return "narrow";
  if (window.matchMedia(NARROW_MQ).matches) return "narrow";
  return "desktop";
}

/** Desktop 1440 layout vs Artboard_2 narrow (859×1623). */
export function useLayoutMode(): {
  mode: LayoutMode;
  /** False until client has read matchMedia — keeps SSR and hydration aligned. */
  ready: boolean;
} {
  const [mode, setMode] = useState<LayoutMode>("desktop");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(NARROW_MQ);
    const sync = () => setMode(readLayoutMode());
    sync();
    setReady(true);
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return { mode, ready };
}

export { readLayoutMode };
