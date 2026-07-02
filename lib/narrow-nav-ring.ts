"use client";

import { useEffect, useState } from "react";

import {
  NARROW_H,
  NARROW_LABEL_TRACKING_EM,
  NARROW_RING_FONT_SIZE_PT,
  NARROW_RING_TEXT_SPAN,
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

/** Label centre angle (rad) on the ring at rotation 0 — from wheel hub. */
export type NarrowLabelAngles = number[];

export type NarrowRingLayout = {
  radius: number;
  fontSizePt: number;
  pathLength: number;
  naturalLength: number;
  labelAngles: NarrowLabelAngles;
  ready: boolean;
};

function ptToPx(pt: number): number {
  return pt * (96 / 72);
}

/** Measured label-centre angles (Arial 800, 70.5pt, tracking −0.1) — fallback when DOM measure fails. */
export const NARROW_BAKED_LABEL_ANGLES: NarrowLabelAngles = [
  -1.334251379022796,
  -0.7806318491929849,
  -0.02934373891513474,
  0.7336411676992275,
  1.2091152343133267,
  2.007979866877421,
  3.077590146039743,
  -2.4462575819525934,
];

function estimatedLabelAngles(_spanFraction: number): NarrowLabelAngles {
  return NARROW_BAKED_LABEL_ANGLES;
}

function angleFromPathPoint(path: SVGPathElement, distance: number): number {
  const pathLength = path.getTotalLength();
  const pt = path.getPointAtLength(((distance % pathLength) + pathLength) % pathLength);
  return Math.atan2(
    pt.y - NARROW_WHEEL_CENTER.y,
    pt.x - NARROW_WHEEL_CENTER.x,
  );
}

/** Word-centre angles from textPath substring lengths + circle geometry. */
export function measureLabelAnglesFromTextPath(
  path: SVGPathElement,
  textPath: SVGTextPathElement,
  pathOffset = 0,
): NarrowLabelAngles | null {
  try {
    let charIndex = 0;
    const angles = LABELS.map((label) => {
      const start = textPath.getSubStringLength(0, charIndex);
      const wordLen = textPath.getSubStringLength(charIndex, label.length);
      charIndex += label.length + 1;
      return angleFromPathPoint(path, pathOffset + start + wordLen / 2);
    });
    return angles.every((a) => Number.isFinite(a)) ? angles : null;
  } catch {
    return null;
  }
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
  tp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#ring-measure-path");
  tp.setAttribute("xml:space", "preserve");
  for (const label of LABELS) {
    const tspan = document.createElementNS(NS, "tspan");
    tspan.textContent = label;
    tp.appendChild(tspan);
    tp.appendChild(document.createTextNode(" "));
  }
  text.appendChild(tp);
  svg.appendChild(text);
  document.body.appendChild(svg);

  return { svg, path, tp: tp as SVGTextPathElement };
}

/** Measure visual word centres at the locked font size (bbox on ring path). */
function measureLabelAngles(
  fontSizePt: number,
  radius: number,
): { naturalLength: number; labelAngles: NarrowLabelAngles } {
  const pathLength = 2 * Math.PI * radius;
  const fallback = {
    naturalLength: pathLength * NARROW_RING_TEXT_SPAN,
    labelAngles: estimatedLabelAngles(NARROW_RING_TEXT_SPAN),
  };
  const { svg, path, tp } = createMeasureSvg(fontSizePt, radius);
  try {
    const naturalLength = tp.getComputedTextLength?.() ?? 0;
    const fromPath = measureLabelAnglesFromTextPath(path, tp);
    if (fromPath) {
      return {
        naturalLength: naturalLength > 0 ? naturalLength : fallback.naturalLength,
        labelAngles: fromPath,
      };
    }
    return {
      naturalLength: fallback.naturalLength,
      labelAngles: NARROW_BAKED_LABEL_ANGLES,
    };
  } finally {
    document.body.removeChild(svg);
  }
}

/** Locked smart-object ring — fixed radius + type on every narrow screen. */
function staticRingLayout(): NarrowRingLayout {
  const radius = NARROW_WHEEL_R;
  const fontSizePt = NARROW_RING_FONT_SIZE_PT;
  const pathLength = 2 * Math.PI * radius;
  return {
    radius,
    fontSizePt,
    pathLength,
    naturalLength: pathLength,
    labelAngles: NARROW_BAKED_LABEL_ANGLES,
    ready: true,
  };
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
    /* fall through — measure with fallback stack */
  }
}

export function measureNarrowRingLayout(): NarrowRingLayout {
  const base = staticRingLayout();

  if (typeof document === "undefined") {
    return base;
  }

  const { naturalLength, labelAngles } = measureLabelAngles(
    base.fontSizePt,
    base.radius,
  );

  return {
    ...base,
    naturalLength,
    labelAngles,
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
  labelAngles: NarrowLabelAngles,
): number {
  return (
    labelAngles[i] ??
    -Math.PI / 2 + ((i + 0.5) / LABELS.length) * 2 * Math.PI
  );
}

/** Rotation (rad) that places label `index` at 12 o'clock. */
export function narrowSnapRotation(
  index: number,
  labelAngles: NarrowLabelAngles = NARROW_BAKED_LABEL_ANGLES,
  current = 0,
): number {
  const θ = narrowLabelAngle(index, labelAngles);
  const target = -Math.PI / 2 - θ;
  const k = Math.round((current - target) / (2 * Math.PI));
  return target + k * 2 * Math.PI;
}

/** Which label sits closest to 12 o'clock at rotation φ. */
export function narrowIndexAtTop(
  rotation: number,
  labelAngles: NarrowLabelAngles,
): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < LABELS.length; i++) {
    const snap = narrowSnapRotation(i, labelAngles, rotation);
    const dist = Math.abs(snap - rotation);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/**
 * Nearest label to a point — distance to each label's position on the rotated ring.
 */
export function narrowIndexNearestOnRing(
  px: number,
  py: number,
  rotation: number,
  labelAngles: NarrowLabelAngles,
): number {
  const cx = NARROW_WHEEL_CENTER.x;
  const cy = NARROW_WHEEL_CENTER.y;
  const r = NARROW_WHEEL_R;
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  let best = 0;
  let bestDist = Infinity;

  for (let i = 0; i < LABELS.length; i++) {
    const θ = narrowLabelAngle(i, labelAngles);
    const dx = r * Math.cos(θ);
    const dy = r * Math.sin(θ);
    const x = cx + dx * c - dy * s;
    const y = cy + dx * s + dy * c;
    const d = Math.hypot(px - x, py - y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Rotation delta (rad) so the focused label centre sits on the vertical axis.
 */
export function narrowVisualSnapDelta(
  focusedIndex: number,
  container: HTMLElement | null,
): number {
  if (!container || focusedIndex < 0 || focusedIndex >= LABELS.length) return 0;
  const tspan = document.getElementById(`circular-nav-item-${focusedIndex}`);
  if (!tspan) return 0;

  const wrapRect = container.getBoundingClientRect();
  if (wrapRect.width <= 0 || wrapRect.height <= 0) return 0;

  const u = wrapRect.width / NARROW_W;
  const trect = tspan.getBoundingClientRect();
  const mx = (trect.left + trect.width / 2 - wrapRect.left) / u;
  const dx = mx - NARROW_WHEEL_CENTER.x;

  if (Math.abs(dx) < 0.35) return 0;

  const r = NARROW_WHEEL_R;
  const ratio = Math.max(-1, Math.min(1, dx / r));
  return -Math.asin(ratio);
}

export { LABELS as NARROW_NAV_LABELS, NARROW_WHEEL_CENTER };
