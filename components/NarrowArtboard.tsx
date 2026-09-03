"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { VISUAL_VIEWPORT_EVENT } from "@/lib/pin-visual-viewport";
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

/** Size of #__next (inset:0 ICB). Not innerHeight, visualViewport, or svh. */
function readViewport() {
  const shell = document.getElementById("__next");
  let vw = shell?.clientWidth || document.documentElement.clientWidth || 0;
  let vh = shell?.clientHeight || document.documentElement.clientHeight || 0;
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
  const vv = window.visualViewport;
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  window.addEventListener("pageshow", onChange);
  window.addEventListener(VISUAL_VIEWPORT_EVENT, onChange);
  vv?.addEventListener("resize", onChange);
  vv?.addEventListener("scroll", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
    window.removeEventListener("pageshow", onChange);
    window.removeEventListener(VISUAL_VIEWPORT_EVENT, onChange);
    vv?.removeEventListener("resize", onChange);
    vv?.removeEventListener("scroll", onChange);
  };
}

export function useNarrowArtboardMetrics(): Metrics {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Letterboxes Artboard_2 (859×1623) centered in #__next.
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

/** Wheel + hub, scaled and centered in #__next (logo / footer stay on the shell). */
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
          visibility: s > 0 ? "visible" : "hidden",
          transform: `translate(${ox}px, ${oy}px) scale(${s || 1})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
