"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import {
  NARROW_H,
  NARROW_W,
  narrowArtboardScale,
  narrowLandingChrome,
  narrowLandingWheelScale,
} from "@/lib/narrow-stage";
import {
  readStableLayoutSize,
  subscribeStableLayout,
} from "@/lib/stable-viewport";

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
 * Size the landing from a chrome-stable layout size (URL bar / keyboard
 * must not rescale the artboard). Phones still clamp inflated “Request
 * Desktop Website” widths into the visible band.
 */
function readViewport() {
  const stable = readStableLayoutSize();
  let vw = stable.width;
  let vh = stable.height;
  const shell = document.getElementById("__next");
  const shellW = shell?.clientWidth || document.documentElement.clientWidth || 0;
  if (shellW > 0) vw = Math.min(vw, shellW);

  const vv = window.visualViewport;
  const vvW = vv && vv.width >= 200 ? vv.width : 0;
  const screenMin = Math.min(screen.width, screen.height) || 0;
  const phone = screenMin > 0 && screenMin <= 500;
  let vx = 0;
  const vy = 0;

  if (phone) {
    if (vvW && vw > vvW * 1.2) {
      vw = Math.round(vvW);
      vx = Math.round(vv?.offsetLeft ?? 0);
    } else if (vw > screenMin * 1.35) {
      vw = screenMin;
      vx = 0;
    } else if (vw) {
      vw = Math.min(vw, screenMin);
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
  const unsub = subscribeStableLayout(onChange);
  /* Safari often reports the real CSS size one frame after first paint. */
  let raf2 = 0;
  const raf1 = window.requestAnimationFrame(() => {
    onChange();
    raf2 = window.requestAnimationFrame(onChange);
  });
  return () => {
    window.cancelAnimationFrame(raf1);
    window.cancelAnimationFrame(raf2);
    unsub();
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
