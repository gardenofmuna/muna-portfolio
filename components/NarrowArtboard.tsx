"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import {
  NARROW_H,
  NARROW_W,
  narrowArtboardScale,
  narrowLandingChrome,
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

const INITIAL: Metrics = {
  u: 1,
  ox: 0,
  oy: 0,
  vw: 0,
  vh: 0,
  vx: 0,
  vy: 0,
};

let cached: Metrics = INITIAL;

/**
 * Layout viewport only. visualViewport is 0 in some in-app browsers and
 * changes with the iOS toolbar — both stretch the ring into an oval.
 * Phone screens also reject inflated “desktop website” innerWidths.
 */
function readViewport() {
  const layoutW = document.documentElement.clientWidth || window.innerWidth || 0;
  const layoutH =
    document.documentElement.clientHeight || window.innerHeight || 0;
  const screenMin = Math.min(screen.width, screen.height) || 0;
  const screenMax = Math.max(screen.width, screen.height) || 0;
  const phone = screenMin > 0 && screenMin <= 500;

  let vw = layoutW;
  let vh = layoutH;

  if (phone) {
    if (!vw || vw > screenMin * 1.35) vw = screenMin;
    else vw = Math.min(vw, screenMin);
    if (!vh) vh = screenMax;
    else vh = Math.min(Math.max(vh, screenMin), screenMax);
  }

  return { vw, vh, vx: 0, vy: 0 };
}

function metricsFromViewport(): Metrics {
  const { vw, vh, vx, vy } = readViewport();
  const u = vw > 0 && vh > 0 ? narrowArtboardScale(vw, vh) : 0;
  return {
    u,
    ox: (vw - NARROW_W * u) / 2 + vx,
    oy: (vh - NARROW_H * u) / 2 + vy,
    vw,
    vh,
    vx,
    vy,
  };
}

function sameMetrics(a: Metrics, b: Metrics) {
  return (
    a.u === b.u &&
    a.ox === b.ox &&
    a.oy === b.oy &&
    a.vw === b.vw &&
    a.vh === b.vh &&
    a.vx === b.vx &&
    a.vy === b.vy
  );
}

function getSnapshot(): Metrics {
  const next = metricsFromViewport();
  if (sameMetrics(cached, next)) return cached;
  cached = next;
  return cached;
}

function getServerSnapshot(): Metrics {
  return INITIAL;
}

function subscribe(onStoreChange: () => void) {
  const onChange = () => onStoreChange();
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  window.addEventListener("pageshow", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

export function useNarrowArtboardMetrics(): Metrics {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function uniformScale(scale: number, x: number, y: number) {
  return `matrix(${scale}, 0, 0, ${scale}, ${x}, ${y})`;
}

/**
 * Letterboxes Artboard_2 (859×1623) centered in the viewport.
 * Children use artboard px coordinates — the shell handles scale + centering.
 */
export function NarrowArtboard({ children }: { children: ReactNode }) {
  const { u, ox, oy, vw } = useNarrowArtboardMetrics();
  const ready = vw > 0 && u > 0;

  return (
    <div
      className="absolute left-0 top-0 overflow-visible"
      style={{
        width: NARROW_W,
        height: NARROW_H,
        transform: uniformScale(ready ? u : 1, ox, oy),
        transformOrigin: "0 0",
        visibility: ready ? "visible" : "hidden",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Wheel stage: hub sits on the midpoint between the landing header and footer.
 */
export function NarrowWheelFit({ children }: { children: ReactNode }) {
  const { u, vw, vh, vx, vy } = useNarrowArtboardMetrics();
  const extra = narrowLandingWheelScale(vw, u, vh);
  const ready = vw > 0 && vh > 0 && u > 0;
  const total = ready ? u * extra : 1;
  const { midY } = narrowLandingChrome(u, vh);
  const ox = vx + vw / 2 - (NARROW_W / 2) * total;
  const oy = vy + midY - (NARROW_H / 2) * total;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <div
        className="pointer-events-auto absolute left-0 top-0"
        style={{
          width: NARROW_W,
          height: NARROW_H,
          transform: uniformScale(total, ox, oy),
          transformOrigin: "0 0",
          visibility: ready ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
