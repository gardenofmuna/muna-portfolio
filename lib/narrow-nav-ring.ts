"use client";

import { useEffect, useState } from "react";

import {
  NARROW_H,
  NARROW_LABEL_FONT_PT,
  NARROW_LABEL_TRACKING_EM,
  NARROW_RING_FONT_SCALE,
  NARROW_W,
  NARROW_WHEEL_CENTER,
  NARROW_WHEEL_EDGE_OVERFLOW,
} from "@/lib/narrow-stage";

const LABELS = [
  "about",
  "design",
  "installation",
  "photos",
  "film",
  "selected works",
  "cv + press",
  "contact",
] as const;

/** Headroom so contact + trailing space never clip at path end. */
const RING_CLIP_MARGIN_PX = 4;

const MAX_FONT_PT = NARROW_LABEL_FONT_PT * 1.5;
const MIN_FONT_PT = NARROW_LABEL_FONT_PT * 0.72;

export type NarrowArcCenters = number[];

export type NarrowRingLayout = {
  radius: number;
  fontSizePt: number;
  pathLength: number;
  naturalLength: number;
  arcCenters: NarrowArcCenters;
  ready: boolean;
};

function ptToPx(pt: number): number {
  return pt * (96 / 72);
}

export function narrowRingPathD(radius: number): string {
  const cx = NARROW_WHEEL_CENTER.x;
  const cy = NARROW_WHEEL_CENTER.y;
  return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius}`;
}

export function ringWordText(index: number): string {
  return LABELS[index]!;
}

/** Trailing space after every word — closure gap matches all others. */
export function ringFullText(): string {
  return LABELS.map((label) => `${label} `).join("");
}

function createMeasureSvg(fontSizePt: number, radius: number) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", String(NARROW_W));
  svg.setAttribute("height", String(NARROW_H));
  svg.setAttribute("viewBox", `0 0 ${NARROW_W} ${NARROW_H}`);
  svg.style.cssText =
    "position:fixed;left:-10000px;top:0;overflow:visible;visibility:hidden;pointer-events:none";

  const defs = document.createElementNS(NS, "defs");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("id", "ring-measure-path");
  path.setAttribute("d", narrowRingPathD(radius));
  defs.appendChild(path);
  svg.appendChild(defs);

  const text = document.createElementNS(NS, "text");
  text.setAttribute("font-family", '"Arial MT Std", Arial, Helvetica, sans-serif');
  text.setAttribute("font-size", `${fontSizePt}pt`);
  text.setAttribute("font-weight", "800");
  text.setAttribute("letter-spacing", `${NARROW_LABEL_TRACKING_EM}em`);
  text.setAttribute("xml:space", "preserve");
  text.setAttribute("text-transform", "lowercase");

  const tp = document.createElementNS(NS, "textPath");
  tp.setAttribute("href", "#ring-measure-path");
  tp.setAttribute("xml:space", "preserve");
  tp.textContent = ringFullText();
  text.appendChild(tp);
  svg.appendChild(text);
  document.body.appendChild(svg);

  return { svg, tp: tp as SVGTextPathElement };
}

function measureRing(
  fontSizePt: number,
  radius: number,
): { naturalLength: number; arcCenters: NarrowArcCenters } {
  const pathLength = 2 * Math.PI * radius;
  const { svg, tp } = createMeasureSvg(fontSizePt, radius);
  try {
    const naturalLength = tp.getComputedTextLength?.() ?? 0;
    let charIndex = 0;
    const arcCenters = LABELS.map((label) => {
      const start = tp.getSubStringLength?.(0, charIndex) ?? 0;
      const wordLen = tp.getSubStringLength?.(charIndex, label.length) ?? 0;
      charIndex += label.length + 1;
      return (start + wordLen / 2) / pathLength;
    });
    return { naturalLength, arcCenters };
  } finally {
    document.body.removeChild(svg);
  }
}

/** Largest pt where the full string (incl. contact + space) fits inside the ring. */
function fontSizePtForRing(pathLength: number, radius: number): number {
  const targetMax = pathLength - RING_CLIP_MARGIN_PX;
  let lo = MIN_FONT_PT;
  let hi = MAX_FONT_PT;
  let best = MIN_FONT_PT;

  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const { naturalLength } = measureRing(mid, radius);
    if (naturalLength <= 0) {
      hi = mid;
      continue;
    }
    if (naturalLength <= targetMax) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  let pt = best;
  let { naturalLength, arcCenters } = measureRing(pt, radius);
  while (naturalLength > targetMax && pt > MIN_FONT_PT) {
    pt *= 0.985;
    ({ naturalLength, arcCenters } = measureRing(pt, radius));
  }

  return pt;
}

function fallbackLayout(): NarrowRingLayout {
  const radius = NARROW_W / 2 + NARROW_WHEEL_EDGE_OVERFLOW;
  const pathLength = 2 * Math.PI * radius;
  return {
    radius,
    fontSizePt: NARROW_LABEL_FONT_PT * 1.15 * NARROW_RING_FONT_SCALE,
    pathLength,
    naturalLength: pathLength * 0.97,
    arcCenters: LABELS.map((_, i) => (i + 0.5) / LABELS.length),
    ready: true,
  };
}

const FONT_LOAD_TIMEOUT_MS = 2000;

async function waitForRingFonts(): Promise<void> {
  const load = document.fonts.load(
    `800 ${ptToPx(MAX_FONT_PT * NARROW_RING_FONT_SCALE)}px "Arial MT Std"`,
  );
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, FONT_LOAD_TIMEOUT_MS);
  });
  try {
    await Promise.race([load, timeout]);
    await Promise.race([document.fonts.ready, timeout]);
  } catch {
    /* Arial MT Std may be unavailable — measure with fallback stack */
  }
}

export function measureNarrowRingLayout(): NarrowRingLayout {
  if (typeof document === "undefined") {
    return fallbackLayout();
  }

  const radius = NARROW_W / 2 + NARROW_WHEEL_EDGE_OVERFLOW;
  const pathLength = 2 * Math.PI * radius;
  const targetMax = pathLength - RING_CLIP_MARGIN_PX;
  let fontSizePt = fontSizePtForRing(pathLength, radius) * NARROW_RING_FONT_SCALE;
  let { naturalLength, arcCenters } = measureRing(fontSizePt, radius);
  while (naturalLength > targetMax && fontSizePt > MIN_FONT_PT) {
    fontSizePt *= 0.985;
    ({ naturalLength, arcCenters } = measureRing(fontSizePt, radius));
  }

  return {
    radius,
    fontSizePt,
    pathLength,
    naturalLength,
    arcCenters,
    ready: true,
  };
}

export function useNarrowRingLayout(enabled: boolean): NarrowRingLayout {
  const [layout, setLayout] = useState<NarrowRingLayout>(fallbackLayout);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      await waitForRingFonts();
      if (cancelled) return;
      try {
        setLayout(measureNarrowRingLayout());
      } catch {
        if (!cancelled) setLayout(fallbackLayout());
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return layout;
}

export function narrowLabelAngle(
  i: number,
  arcCenters: NarrowArcCenters,
): number {
  const frac = arcCenters[i] ?? (i + 0.5) / LABELS.length;
  return -Math.PI / 2 + frac * 2 * Math.PI;
}

export { LABELS as NARROW_NAV_LABELS, NARROW_WHEEL_CENTER };
