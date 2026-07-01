"use client";

import { useEffect, useState } from "react";

import {
  NARROW_H,
  NARROW_LABEL_TRACKING_EM,
  NARROW_RING_FONT_SIZE_PT,
  NARROW_W,
  NARROW_WHEEL_CENTER,
  NARROW_WHEEL_R,
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

function equalArcCenters(): NarrowArcCenters {
  return LABELS.map((_, i) => (i + 0.5) / LABELS.length);
}

function staticRingLayout(): NarrowRingLayout {
  const radius = NARROW_WHEEL_R;
  const pathLength = 2 * Math.PI * radius;
  return {
    radius,
    fontSizePt: NARROW_RING_FONT_SIZE_PT,
    pathLength,
    naturalLength: pathLength,
    arcCenters: equalArcCenters(),
    ready: true,
  };
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

/** Measure word centres at the locked font size (arc positions only). */
function measureArcCenters(
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

const FONT_LOAD_TIMEOUT_MS = 2000;

async function waitForRingFonts(): Promise<void> {
  const load = document.fonts.load(
    `800 ${ptToPx(NARROW_RING_FONT_SIZE_PT)}px "Arial MT Std"`,
  );
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, FONT_LOAD_TIMEOUT_MS);
  });
  try {
    await Promise.race([load, timeout]);
    await Promise.race([document.fonts.ready, timeout]);
  } catch {
    /* fall through */
  }
}

/**
 * Locked smart-object ring — fixed radius + font; only arc centres are measured once.
 */
export function measureNarrowRingLayout(): NarrowRingLayout {
  const radius = NARROW_WHEEL_R;
  const fontSizePt = NARROW_RING_FONT_SIZE_PT;
  const pathLength = 2 * Math.PI * radius;

  if (typeof document === "undefined") {
    return staticRingLayout();
  }

  const { naturalLength, arcCenters } = measureArcCenters(fontSizePt, radius);

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
  const [layout, setLayout] = useState<NarrowRingLayout>(staticRingLayout);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      await waitForRingFonts();
      if (cancelled) return;
      try {
        setLayout(measureNarrowRingLayout());
      } catch {
        if (!cancelled) setLayout(staticRingLayout());
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
