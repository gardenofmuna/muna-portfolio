"use client";

import { useEffect, useState } from "react";

import {
  NARROW_H,
  NARROW_LABEL_BAND_PX,
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
  const arcs = measureLabelArcsFromTextPath(path, textPath, pathOffset);
  if (!arcs) return null;
  return arcs.map((a) => a.center);
}

/** Per-word angular spans along the ring path (for tap hit testing). */
export function measureLabelArcsFromTextPath(
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

/** Fallback slots — proportional to label length along the path (path order). */
export function buildLabelArcsFromAngles(
  labelAngles: NarrowLabelAngles,
  pathLength = 2 * Math.PI * NARROW_WHEEL_R,
): NarrowLabelArc[] {
  const totalChars = LABELS.reduce((acc, label) => acc + label.length + 1, 0);
  let charIndex = 0;
  return LABELS.map((label, i) => {
    const pathStart = (charIndex / totalChars) * pathLength;
    charIndex += label.length + 1;
    const pathEnd = (charIndex / totalChars) * pathLength;
    const center = labelAngles[i] ?? -Math.PI / 2 + ((i + 0.5) / LABELS.length) * 2 * Math.PI;
    return {
      pathStart,
      pathEnd,
      start: center,
      end: center,
      center,
    };
  });
}

const TWO_PI = 2 * Math.PI;

function normalizeAngle(a: number): number {
  let x = a % TWO_PI;
  if (x < 0) x += TWO_PI;
  return x;
}

function pathOrderMidpoint(from: number, to: number): number {
  let span = to - from;
  if (span <= 0) span += TWO_PI;
  return normalizeAngle(from + span / 2);
}

function angleInClockwiseWedge(
  angle: number,
  start: number,
  end: number,
): boolean {
  const a = normalizeAngle(angle);
  const s = normalizeAngle(start);
  const e = normalizeAngle(end);
  if (s <= e) return a >= s && a <= e;
  return a >= s || a <= e;
}

function nearestLabelByCenter(
  localAngle: number,
  labelArcs: NarrowLabelArc[],
): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < labelArcs.length; i++) {
    const center = labelArcs[i]!.center;
    let d = Math.abs(normalizeAngle(localAngle - center));
    if (d > Math.PI) d = TWO_PI - d;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export type NarrowLabelWedge = {
  index: number;
  start: number;
  end: number;
  center: number;
};

/** Non-overlapping tap wedges — midpoints between neighbours in path order. */
export function buildNarrowLabelWedges(
  labelArcs: NarrowLabelArc[],
): NarrowLabelWedge[] {
  const centers = labelArcs.map((a) => a.center);
  const n = centers.length;
  return centers.map((center, i) => {
    const prev = centers[(i + n - 1) % n]!;
    const next = centers[(i + 1) % n]!;
    return {
      index: i,
      center,
      start: pathOrderMidpoint(prev, center),
      end: pathOrderMidpoint(center, next),
    };
  });
}

/** SVG arc segment for an invisible stroke hit target on the ring. */
export function narrowWedgeArcPath(
  cx: number,
  cy: number,
  radius: number,
  startRad: number,
  endRad: number,
): string {
  const x0 = cx + radius * Math.cos(startRad);
  const y0 = cy + radius * Math.sin(startRad);
  const x1 = cx + radius * Math.cos(endRad);
  const y1 = cy + radius * Math.sin(endRad);
  let span = endRad - startRad;
  if (span <= 0) span += TWO_PI;
  const largeArc = span > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1}`;
}

/** Topmost painted element under a screen tap (hit paths or label glyphs). */
export function narrowIndexFromTapStack(
  clientX: number,
  clientY: number,
): number | null {
  if (typeof document === "undefined") return null;
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    const attr = el.getAttribute("data-nav-hit-index");
    if (attr != null) {
      const i = Number.parseInt(attr, 10);
      if (i >= 0 && i < LABELS.length) return i;
    }
    const idMatch = el.id?.match(/^(?:circular-nav-item|narrow-nav-hit)-(\d+)$/);
    if (idMatch) {
      const i = Number.parseInt(idMatch[1]!, 10);
      if (i >= 0 && i < LABELS.length) return i;
    }
  }
  return null;
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
): {
  naturalLength: number;
  labelAngles: NarrowLabelAngles;
  labelArcs: NarrowLabelArc[];
} {
  const pathLength = 2 * Math.PI * radius;
  const fallbackAngles = estimatedLabelAngles(NARROW_RING_TEXT_SPAN);
  const fallback = {
    naturalLength: pathLength * NARROW_RING_TEXT_SPAN,
    labelAngles: fallbackAngles,
    labelArcs: buildLabelArcsFromAngles(fallbackAngles, pathLength),
  };
  const { svg, path, tp } = createMeasureSvg(fontSizePt, radius);
  try {
    const naturalLength = tp.getComputedTextLength?.() ?? 0;
    const fromArcs = measureLabelArcsFromTextPath(path, tp);
    if (fromArcs) {
      return {
        naturalLength: naturalLength > 0 ? naturalLength : fallback.naturalLength,
        labelAngles: fromArcs.map((a) => a.center),
        labelArcs: fromArcs,
      };
    }
    return {
      naturalLength: fallback.naturalLength,
      labelAngles: NARROW_BAKED_LABEL_ANGLES,
      labelArcs: buildLabelArcsFromAngles(NARROW_BAKED_LABEL_ANGLES, pathLength),
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
    labelArcs: buildLabelArcsFromAngles(NARROW_BAKED_LABEL_ANGLES, pathLength),
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
 * Label under a tap — wheel-local angular wedges (path order, no wrap overlap).
 */
export function narrowIndexFromRingTap(
  px: number,
  py: number,
  rotation: number,
  labelArcs: NarrowLabelArc[],
  _pathLength = 2 * Math.PI * NARROW_WHEEL_R,
): number {
  const cx = NARROW_WHEEL_CENTER.x;
  const cy = NARROW_WHEEL_CENTER.y;
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.hypot(dx, dy);
  const r = NARROW_WHEEL_R;

  const tapAngle = Math.atan2(dy, dx);
  const localAngle = normalizeAngle(tapAngle - rotation);

  if (dist < r - NARROW_LABEL_BAND_PX * 1.5 || dist > r + NARROW_LABEL_BAND_PX * 1.5) {
    return nearestLabelByCenter(localAngle, labelArcs);
  }

  const wedges = buildNarrowLabelWedges(labelArcs);
  for (const wedge of wedges) {
    if (angleInClockwiseWedge(localAngle, wedge.start, wedge.end)) {
      return wedge.index;
    }
  }
  return nearestLabelByCenter(localAngle, labelArcs);
}

/** @deprecated use narrowIndexFromRingTap */
export function narrowIndexNearestOnRing(
  px: number,
  py: number,
  rotation: number,
  labelAngles: NarrowLabelAngles,
): number {
  return narrowIndexFromRingTap(
    px,
    py,
    rotation,
    buildLabelArcsFromAngles(labelAngles),
  );
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
