"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  NARROW_H,
  NARROW_W,
  narrowArtboardScale,
  narrowLandingWheelScale,
} from "@/lib/narrow-stage";

type Metrics = {
  u: number;
  ox: number;
  oy: number;
  vw: number;
  vh: number;
  vx: number;
  vy: number;
};

function readViewport() {
  const vv = window.visualViewport;
  return {
    vw: vv?.width ?? window.innerWidth,
    vh: vv?.height ?? window.innerHeight,
    vx: vv?.offsetLeft ?? 0,
    vy: vv?.offsetTop ?? 0,
  };
}

export function useNarrowArtboardMetrics(): Metrics {
  const [m, setM] = useState<Metrics>({
    u: 1,
    ox: 0,
    oy: 0,
    vw: 0,
    vh: 0,
    vx: 0,
    vy: 0,
  });

  useEffect(() => {
    const read = () => {
      const { vw, vh, vx, vy } = readViewport();
      const u = narrowArtboardScale(vw, vh);
      setM({
        u,
        ox: (vw - NARROW_W * u) / 2 + vx,
        oy: (vh - NARROW_H * u) / 2 + vy,
        vw,
        vh,
        vx,
        vy,
      });
    };
    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
    };
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
      className="absolute left-0 top-0 overflow-visible"
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

/**
 * Viewport-centered wheel stage: hub sits in the middle of the visible
 * page, then the ring scales out to the tablet/phone side inset.
 */
export function NarrowWheelFit({ children }: { children: ReactNode }) {
  const { u, vw, vh, vx, vy } = useNarrowArtboardMetrics();
  const extra = narrowLandingWheelScale(vw, u);
  const ready = vw > 0 && vh > 0 && u > 0;
  const total = ready ? u * extra : 1;
  const ox = vx + vw / 2 - (NARROW_W / 2) * total;
  const oy = vy + vh / 2 - (NARROW_H / 2) * total;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <div
        className="pointer-events-auto absolute left-0 top-0"
        style={{
          width: NARROW_W,
          height: NARROW_H,
          transform: `translate(${ox}px, ${oy}px) scale(${total})`,
          transformOrigin: "0 0",
          visibility: ready ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
