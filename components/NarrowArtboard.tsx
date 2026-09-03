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
 * Layout size for chrome (logo / footer type). Real phones ignore Safari’s
 * first-load ~980px innerWidth. Preview panes use the pane, not the monitor.
 */
function readViewport() {
  let vw = document.documentElement.clientWidth || window.innerWidth || 0;
  let vh = document.documentElement.clientHeight || window.innerHeight || 0;
  const screenMin = Math.min(screen.width, screen.height) || 0;
  const phone = screenMin > 0 && screenMin <= 500;
  if (phone && vw > screenMin * 1.35) vw = screenMin;
  else if (phone && vw) vw = Math.min(vw, screenMin);
  return { vw, vh, vx: 0, vy: 0 };
}

function metricsFromViewport(): Metrics {
  const { vw, vh, vx, vy } = readViewport();
  const u = vw > 0 && vh > 0 ? narrowArtboardScale(vw, vh) : 1;
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

/**
 * Letterboxes Artboard_2 (859×1623) centered in the viewport.
 * Used by project pages for wordmark sizing — not the landing wheel.
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
 * Quadrant 2: circular nav + hub, scaled to design-page side padding
 * and centered between the logo and footer.
 */
export function NarrowWheelFit({ children }: { children: ReactNode }) {
  const { vw, vh, u } = useNarrowArtboardMetrics();
  const s = vw > 0 && vh > 0 ? narrowLandingWheelScale(vw, u, vh) : 0;
  const { midY } = narrowLandingChrome(u, vh);
  const ox = (vw - NARROW_W * s) / 2;
  const oy = midY - (NARROW_H * s) / 2;

  return (
    <div className="narrow-wheel-slot">
      <div
        className="pointer-events-auto absolute left-0 top-0"
        style={{
          width: NARROW_W,
          height: NARROW_H,
          transform: `translate(${ox}px, ${oy}px) scale(${s || 1})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
