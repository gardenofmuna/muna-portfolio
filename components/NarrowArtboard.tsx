"use client";

import { useEffect, useState, type ReactNode } from "react";

import { NARROW_H, NARROW_W } from "@/lib/narrow-stage";

type Metrics = { u: number; ox: number; oy: number };

export function useNarrowArtboardMetrics(): Metrics {
  const [m, setM] = useState<Metrics>({ u: 1, ox: 0, oy: 0 });

  useEffect(() => {
    const read = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      /** Phones: full-width scale (Vercel). Desktop preview: letterboxed smart-object. */
      const fillWidth = window.matchMedia("(pointer: coarse)").matches;
      const u = fillWidth
        ? vw / NARROW_W
        : Math.min(vw / NARROW_W, vh / NARROW_H);
      setM({
        u,
        ox: (vw - NARROW_W * u) / 2,
        oy: (vh - NARROW_H * u) / 2,
      });
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  return m;
}

/**
 * Letterboxes Artboard_2 (859×1623) centered in the viewport.
 * Children use artboard px coordinates — the shell handles scale + centering.
 */
export function NarrowArtboard({ children }: { children: ReactNode }) {
  const { u, ox, oy } = useNarrowArtboardMetrics();

  return (
    <div
      className="absolute left-0 top-0 overflow-hidden"
      style={{
        width: NARROW_W,
        height: NARROW_H,
        transform: `translate(${ox}px, ${oy}px) scale(${u})`,
        transformOrigin: "0 0",
      }}
    >
      {children}
    </div>
  );
}
