"use client";

import { useEffect, useState } from "react";

import { NARROW_W } from "@/lib/narrow-stage";

export type LayoutMode = "desktop" | "narrow";

const NARROW_MQ = `(max-width: ${NARROW_W}px), (max-width: 1023px) and (orientation: portrait)`;

function readLayoutMode(): LayoutMode {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia(NARROW_MQ).matches ? "narrow" : "desktop";
}

/** Desktop 1440 layout vs Artboard_2 narrow (859×1623). */
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>("desktop");

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MQ);
    const sync = () => setMode(mq.matches ? "narrow" : "desktop");
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return mode;
}

export { readLayoutMode };
