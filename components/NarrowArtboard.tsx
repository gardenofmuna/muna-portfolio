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

/** SSR / hydration — iPhone 14 CSS px so the wheel never paints at scale(1). */
const SSR_VIEWPORT = { vw: 390, vh: 844 };

function metricsFromSize(
  vw: number,
  vh: number,
  vx = 0,
  vy = 0,
): Metrics {
  const u = narrowArtboardScale(vw, vh);
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

const SSR_METRICS = metricsFromSize(SSR_VIEWPORT.vw, SSR_VIEWPORT.vh);

let cached: Metrics = SSR_METRICS;

/**
 * Size the landing from the laid-out #__next shell — not a stale ~980px
 * Safari innerWidth. Phones also clamp to screen / visualViewport when the
 * layout viewport is inflated (first paint, “Request Desktop Website”).
 *
 * When the shell is wider than the visible phone width, vx/vy shift chrome
 * into the visual viewport so the ring isn’t stranded on the left of a
 * 980-wide canvas (horizontal scroll “sometimes on load”).
 */
function readViewport() {
  const shell = document.getElementById("__next");
  let vw = shell?.clientWidth || document.documentElement.clientWidth || 0;
  let vh = shell?.clientHeight || document.documentElement.clientHeight || 0;
  if (!vw) vw = window.innerWidth || 0;
  if (!vh) vh = window.innerHeight || 0;
  const shellW = vw;
  const shellH = vh;

  const vv = window.visualViewport;
  const vvW = vv && vv.width >= 200 ? vv.width : 0;
  const vvH = vv && vv.height >= 200 ? vv.height : 0;
  const screenMin = Math.min(screen.width, screen.height) || 0;
  const screenMax = Math.max(screen.width, screen.height) || 0;
  const phone = screenMin > 0 && screenMin <= 500;
  let vx = 0;
  let vy = 0;

  if (phone) {
    // Inflated layout width (≈980) → prefer the visible CSS width.
    if (vvW && vw > vvW * 1.2) {
      vw = Math.round(vvW);
      vx = Math.round(vv?.offsetLeft ?? 0);
    } else if (vw > screenMin * 1.35) {
      vw = screenMin;
      // No visualViewport yet — keep content in the left (visible) band.
      vx = 0;
    } else if (vw) {
      vw = Math.min(vw, screenMin);
    }

    if (vvH && shellH > vvH * 1.35) {
      vh = Math.round(vvH);
      vy = Math.round(vv?.offsetTop ?? 0);
    } else if (screenMax && vh > screenMax * 1.25) {
      vh = screenMax;
    }
  }

  return { vw, vh, vx, vy };
}

function metricsFromViewport(): Metrics {
  const { vw, vh, vx, vy } = readViewport();
  if (vw <= 0 || vh <= 0) return SSR_METRICS;
  return metricsFromSize(vw, vh, vx, vy);
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
  return SSR_METRICS;
}

function subscribe(onStoreChange: () => void) {
  const onChange = () => onStoreChange();
  const vv = window.visualViewport;
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  window.addEventListener("pageshow", onChange);
  vv?.addEventListener("resize", onChange);
  vv?.addEventListener("scroll", onChange);
  // Safari often reports the real CSS size one frame after first paint.
  const raf = window.requestAnimationFrame(() => {
    onChange();
    window.requestAnimationFrame(onChange);
  });
  return () => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
    window.removeEventListener("pageshow", onChange);
    vv?.removeEventListener("resize", onChange);
    vv?.removeEventListener("scroll", onChange);
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
 * Quadrant 2: circular nav + hub, 8px side inset on phones (52px on tablet),
 * centered between the logo and footer.
 */
export function NarrowWheelFit({ children }: { children: ReactNode }) {
  const { vw, vh, u, vx, vy } = useNarrowArtboardMetrics();
  const ready = vw > 0 && vh > 0;
  const s = ready
    ? narrowLandingWheelScale(vw, u, vh)
    : narrowLandingWheelScale(SSR_VIEWPORT.vw, SSR_METRICS.u, SSR_VIEWPORT.vh);
  const layoutVh = ready ? vh : SSR_VIEWPORT.vh;
  const layoutU = ready ? u : SSR_METRICS.u;
  const layoutVw = ready ? vw : SSR_VIEWPORT.vw;
  const { midY } = narrowLandingChrome(layoutU, layoutVh);
  const ox = vx + (layoutVw - NARROW_W * s) / 2;
  const oy = vy + midY - (NARROW_H * s) / 2;

  return (
    <div className="narrow-wheel-slot">
      <div
        className="pointer-events-auto absolute left-0 top-0"
        style={{
          width: NARROW_W,
          height: NARROW_H,
          transform: `translate(${ox}px, ${oy}px) scale(${s})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
