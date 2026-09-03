"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  NARROW_H,
  NARROW_W,
  narrowArtboardScale,
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
  const layoutH = document.documentElement.clientHeight || 0;
  const innerH = window.innerHeight || 0;
  const vv = window.visualViewport;
  const vvH = vv && vv.height >= 200 ? vv.height : 0;
  const vvW = vv && vv.width >= 200 ? vv.width : 0;
  const screenMin = Math.min(screen.width, screen.height) || 0;
  const screenMax = Math.max(screen.width, screen.height) || 0;
  const phone = screenMin > 0 && screenMin <= 500;

  let vw = layoutW || vvW;
  let vh = Math.max(layoutH, innerH, vvH);

  if (phone) {
    if (!vw || vw > screenMin * 1.35) vw = screenMin;
    else vw = Math.min(vw, screenMin);
  }
  if (!vh) vh = screenMax;
  else if (phone) vh = Math.min(vh, screenMax);

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
  window.visualViewport?.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
    window.removeEventListener("pageshow", onChange);
    window.visualViewport?.removeEventListener("resize", onChange);
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
 * Scales the landing wheel to its slot and centers the hub in that slot.
 * Position comes from CSS (header/footer bands), not a one-shot JS height.
 */
export function NarrowWheelFit({ children }: { children: ReactNode }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const read = () => {
      const { width, height } = el.getBoundingClientRect();
      setBox((prev) =>
        prev.w === width && prev.h === height ? prev : { w: width, h: height },
      );
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    const raf = window.requestAnimationFrame(read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const ready = box.w > 0 && box.h > 0;
  const isTablet = box.w >= 700;
  const sideInset = isTablet ? 28 : 16;
  const widthScale = ready ? (box.w - sideInset) / NARROW_W : 0;
  const heightScale = ready ? box.h / NARROW_W : 0;
  let total = Math.min(widthScale, heightScale);
  if (isTablet && widthScale <= heightScale) total *= 0.9;
  const ox = ready ? (box.w - NARROW_W * total) / 2 : 0;
  const oy = ready ? (box.h - NARROW_H * total) / 2 : 0;

  return (
    <div ref={slotRef} className="narrow-wheel-slot">
      <div
        className="pointer-events-auto absolute left-0 top-0"
        style={{
          width: NARROW_W,
          height: NARROW_H,
          transform: uniformScale(ready ? total : 1, ox, oy),
          transformOrigin: "0 0",
          visibility: ready ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
