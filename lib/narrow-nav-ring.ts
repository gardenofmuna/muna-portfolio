"use client";

import {
  NARROW_H,
  NARROW_LABEL_TRACKING_EM,
  NARROW_RING_FONT_SIZE_PT,
  NARROW_W,
  NARROW_WHEEL_CENTER,
  NARROW_WHEEL_R,
} from "@/lib/narrow-stage";

/**
 * Narrow ring geometry — label arcs, snap targets, hit overlays, Safari fallback.
 *
 * Label widths: NARROW_LABEL_WORD_WIDTH_PX (Chromium-measured per word).
 * Regenerate after font/tracking changes: node scripts/measure-ring-widths.mjs
 *
 * Layout: buildDeterministicNarrowLabelArcs() — cumulative widths + gap.
 * Snap: narrowSnapRotation / narrowIndexAtTop; visual fine-tune in
 * narrowVisualSnapDelta (DOM bbox vs hub).
 * Hitboxes: narrowHitOverlayRects() — tangent buttons from labelArcs,
 * radial outset + scaled perpendicular height for glyph envelope.
 * Safari: measureLabelArcsFromTextPath; labelArcsAreUsable() gates fallback
 * to the same deterministic layout.
 *
 * Artboard constants: lib/narrow-stage.ts
 */

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

/** Angular span of one label on the ring (wheel rotation 0). */
export type NarrowLabelArc = {
  /** Distance along the ring path (px) — always pathStart < pathEnd. */
  pathStart: number;
  pathEnd: number;
  start: number;
  end: number;
  center: number;
};

export type NarrowRingLayout = {
  radius: number;
  fontSizePt: number;
  pathLength: number;
  naturalLength: number;
  labelAngles: NarrowLabelAngles;
  labelArcs: NarrowLabelArc[];
  ready: boolean;
};

/**
 * Chromium-measured word widths along the ring path (Arial 800, locked ring type).
 * Same string construction as the SVG textPath: `word + " "` per label.
 * Scales uniformly when pathLength differs from the reference circle.
 */
const NARROW_LABEL_WORD_WIDTH_PX = [
  191.55, 221.81, 356.52, 230.02, 119.72, 503.91, 337.05, 253.67,
] as const;

/** Inter-label space width (trailing space after each word). */
const NARROW_INTER_LABEL_GAP_PX = 16.56;

/** Path length when word widths above were measured. */
const NARROW_RING_LAYOUT_REF_PATH_LENGTH = 2350.56;

const TWO_PI = 2 * Math.PI;

/** Centre angle (rad) from distance along the ring path — path starts at 12 o'clock. */
function angleFromPathDistance(dist: number, pathLength: number): number {
  const d = ((dist % pathLength) + pathLength) % pathLength;
  return -Math.PI / 2 + (d / pathLength) * TWO_PI;
}

/**
 * Deterministic ring layout — cumulative word widths + consistent gaps.
 * One function drives hit targets, snap, and active alignment.
 */
function buildDeterministicNarrowLabelArcs(
  pathLength = 2 * Math.PI * NARROW_WHEEL_R,
): NarrowLabelArc[] {
  const scale = pathLength / NARROW_RING_LAYOUT_REF_PATH_LENGTH;
  const gapPx = NARROW_INTER_LABEL_GAP_PX * scale;
  const n = LABELS.length;
  let cursor = 0;

  return LABELS.map((label, i) => {
    const wordPx = NARROW_LABEL_WORD_WIDTH_PX[i]! * scale;
    const pathStart = cursor;
    const pathEnd = cursor + wordPx;
    const centerDist = pathStart + wordPx / 2;
    cursor = pathEnd + (i < n - 1 ? gapPx : 0);
    return {
      pathStart,
      pathEnd,
      start: angleFromPathDistance(pathStart, pathLength),
      end: angleFromPathDistance(pathEnd, pathLength),
      center: angleFromPathDistance(centerDist, pathLength),
    };
  });
}

/** Derived centre angles — same model as buildDeterministicNarrowLabelArcs. */
export const NARROW_BAKED_LABEL_ANGLES: NarrowLabelAngles =
  buildDeterministicNarrowLabelArcs().map((arc) => arc.center);

function deterministicRingLayout(
  pathLength = 2 * Math.PI * NARROW_WHEEL_R,
): {
  naturalLength: number;
  labelAngles: NarrowLabelAngles;
  labelArcs: NarrowLabelArc[];
} {
  const labelArcs = buildDeterministicNarrowLabelArcs(pathLength);
  const scale = pathLength / NARROW_RING_LAYOUT_REF_PATH_LENGTH;
  const gapPx = NARROW_INTER_LABEL_GAP_PX * scale;
  const naturalLength =
    NARROW_LABEL_WORD_WIDTH_PX.reduce((sum, w) => sum + w * scale, 0) +
    gapPx * (LABELS.length - 1);
  return {
    naturalLength,
    labelAngles: labelArcs.map((arc) => arc.center),
    labelArcs,
  };
}

function angleFromPathPoint(path: SVGPathElement, distance: number): number {
  const pathLength = path.getTotalLength();
  const pt = path.getPointAtLength(((distance % pathLength) + pathLength) % pathLength);
  return Math.atan2(
    pt.y - NARROW_WHEEL_CENTER.y,
    pt.x - NARROW_WHEEL_CENTER.x,
  );
}

/** Per-word angular spans along the ring path (Safari measure). */
function measureLabelArcsFromTextPath(
  path: SVGPathElement,
  textPath: SVGTextPathElement,
  pathOffset = 0,
): NarrowLabelArc[] | null {
  try {
    let charIndex = 0;
    const arcs = LABELS.map((label) => {
      const startLen = textPath.getSubStringLength(0, charIndex);
      const wordLen = textPath.getSubStringLength(charIndex, label.length);
      charIndex += label.length + 1;
      const pathStart = pathOffset + startLen;
      const pathEnd = pathOffset + startLen + wordLen;
      const start = angleFromPathPoint(path, pathStart);
      const end = angleFromPathPoint(path, pathEnd);
      const center = angleFromPathPoint(path, pathStart + wordLen / 2);
      return { pathStart, pathEnd, start, end, center };
    });
    return arcs.every(
      (a) =>
        Number.isFinite(a.pathStart) &&
        Number.isFinite(a.pathEnd) &&
        a.pathEnd > a.pathStart &&
        Number.isFinite(a.center),
    )
      ? arcs
      : null;
  } catch {
    return null;
  }
}

function normalizeAngle(a: number): number {
  let x = a % TWO_PI;
  if (x < 0) x += TWO_PI;
  return x;
}

/** Reject collapsed or clustered label centres — must span the ring. */
function labelCentersAreUsable(centers: number[]): boolean {
  if (centers.length !== LABELS.length) return false;
  if (!centers.every((c) => Number.isFinite(c))) return false;

  const sorted = centers.map((c) => normalizeAngle(c)).sort((a, b) => a - b);

  const coverage = sorted[sorted.length - 1]! - sorted[0]!;
  if (coverage < Math.PI * 1.5) return false;

  const n = sorted.length;
  const gaps: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    gaps.push(sorted[i + 1]! - sorted[i]!);
  }
  gaps.push(TWO_PI - sorted[n - 1]! + sorted[0]!);

  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);
  const idealGap = TWO_PI / n;

  if (minGap < idealGap * 0.35) return false;
  if (maxGap > idealGap * 2.75) return false;

  return true;
}

/** Reject collapsed iOS/Safari textPath measures — centers must span the ring. */
function labelArcsAreUsable(arcs: NarrowLabelArc[]): boolean {
  if (arcs.length !== LABELS.length) return false;

  for (let i = 0; i < arcs.length; i++) {
    const arc = arcs[i]!;
    if (
      !Number.isFinite(arc.center) ||
      !Number.isFinite(arc.start) ||
      !Number.isFinite(arc.end) ||
      arc.pathEnd <= arc.pathStart
    ) {
      return false;
    }
    if (i > 0 && arc.pathStart <= arcs[i - 1]!.pathStart) {
      return false;
    }
  }

  return labelCentersAreUsable(arcs.map((a) => a.center));
}

export type NarrowHitOverlayRect = {
  index: number;
  /** Glyph-centre anchor on the ring (artboard px). */
  centerX: number;
  centerY: number;
  /** Extent along the ring path from pathStart → pathEnd, plus end padding. */
  width: number;
  /** Extent across the glyph band, plus normal padding. */
  height: number;
  /** Tangent angle (rad) — pathStart to pathEnd runs along this axis. */
  angleRad: number;
};

/** Radial offset — hit center sits on glyphs, not the textPath baseline (artboard px). */
const HIT_RADIAL_OUTSET_PX = 8;
/** Perpendicular extent vs bandPx — covers cap height + descenders. */
const HIT_PERP_SCALE = 1.35;

/** HTML tap targets from ring geometry — artboard px, rotation 0 (parent rotator turns). */
export function narrowHitOverlayRects(
  rotation: number,
  labelArcs: NarrowLabelArc[],
  cx: number,
  cy: number,
  radius: number,
  bandPx: number,
): NarrowHitOverlayRect[] {
  /** Padding beyond pathStart / pathEnd along the word tangent. */
  const padEnd = 10;

  return labelArcs.map((arc, index) => {
    const θ = arc.center + rotation;
    const ringX = cx + radius * Math.cos(θ);
    const ringY = cy + radius * Math.sin(θ);
    const centerX = ringX + Math.cos(θ) * HIT_RADIAL_OUTSET_PX;
    const centerY = ringY + Math.sin(θ) * HIT_RADIAL_OUTSET_PX;

    const span = Math.max(arc.pathEnd - arc.pathStart, 0);
    const width = span + padEnd * 2;
    const height = bandPx * HIT_PERP_SCALE;

    return {
      index,
      centerX,
      centerY,
      width,
      height,
      angleRad: θ,
    };
  });
}

export function narrowRingPathD(radius: number): string {
  const cx = NARROW_WHEEL_CENTER.x;
  const cy = NARROW_WHEEL_CENTER.y;
  return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius}`;
}

export function ringWordText(index: number): string {
  return LABELS[index]!;
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
): {
  naturalLength: number;
  labelAngles: NarrowLabelAngles;
  labelArcs: NarrowLabelArc[];
} {
  const pathLength = 2 * Math.PI * radius;
  const fallback = deterministicRingLayout(pathLength);
  const { svg, path, tp } = createMeasureSvg(fontSizePt, radius);
  try {
    const naturalLength = tp.getComputedTextLength?.() ?? 0;
    const fromArcs = measureLabelArcsFromTextPath(path, tp);
    if (fromArcs && labelArcsAreUsable(fromArcs)) {
      return {
        naturalLength: naturalLength > 0 ? naturalLength : fallback.naturalLength,
        labelAngles: fromArcs.map((a) => a.center),
        labelArcs: fromArcs,
      };
    }
    return fallback;
  } finally {
    document.body.removeChild(svg);
  }
}

/** Locked smart-object ring — fixed radius + type on every narrow screen. */
function staticRingLayout(): NarrowRingLayout {
  const radius = NARROW_WHEEL_R;
  const fontSizePt = NARROW_RING_FONT_SIZE_PT;
  const pathLength = 2 * Math.PI * radius;
  const { naturalLength, labelAngles, labelArcs } =
    deterministicRingLayout(pathLength);
  return {
    radius,
    fontSizePt,
    pathLength,
    naturalLength,
    labelAngles,
    labelArcs,
    ready: true,
  };
}

export function measureNarrowRingLayout(): NarrowRingLayout {
  const base = staticRingLayout();

  if (typeof document === "undefined") {
    return base;
  }

  const { naturalLength, labelAngles, labelArcs } = measureLabelAngles(
    base.fontSizePt,
    base.radius,
  );

  return {
    ...base,
    naturalLength,
    labelAngles,
    labelArcs,
    ready: true,
  };
}

export function useNarrowRingLayout(_enabled: boolean): NarrowRingLayout {
  /* Baked layout only. Live Safari textPath measure ran after first paint and
     could replace a circle with an oval until the next refresh. */
  return staticRingLayout();
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

export { LABELS as NARROW_NAV_LABELS };
