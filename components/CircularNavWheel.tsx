"use client";

import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, Fragment } from "react";

import {
  narrowHitOverlayRects,
  narrowIndexAtTop,
  narrowLabelAngle,
  narrowRingPathD,
  narrowSnapRotation,
  narrowVisualSnapDelta,
  NARROW_BAKED_LABEL_ANGLES,
  NARROW_NAV_LABELS,
  ringWordText,
  useNarrowRingLayout,
} from "@/lib/narrow-nav-ring";
import { DesktopStageViewContext } from "@/components/DesktopStageCanvas";
import {
  DESKTOP_LAYOUT_H,
  DESKTOP_LAYOUT_SCALE,
  DESKTOP_LAYOUT_W,
  DESKTOP_STAGE_W,
} from "@/lib/desktop-stage";
import {
  NARROW_H,
  NARROW_LABEL_ACTIVE,
  NARROW_LABEL_BAND_PX,
  NARROW_LABEL_INACTIVE,
  NARROW_LABEL_TRACKING_EM,
  NARROW_W,
  NARROW_WHEEL_CENTER,
} from "@/lib/narrow-stage";

/** Authored desktop label size in layout coords (×2 into the 2875 master). */
const DESKTOP_STAGE_LABEL_FONT_SIZE = "2.88rem";

/**
 * CircularNavWheel — narrow (mobile) and desktop arc navigation.
 *
 * NARROW LAYOUT (Artboard_2, layout="narrow")
 * -----------------------------------------
 * Rotation: a single rotator div applies `rotate(deg)` at the wheel hub
 * (NARROW_WHEEL_CENTER). SVG textPath ring + invisible hit buttons are
 * children of that rotator so labels and hitboxes turn together.
 *
 * Drag: pointerdown on the wrap (not on a hit button) captures the pointer,
 * records atan2 from hub to finger, and applies angle deltas on move.
 * Release snaps to the nearest label at 12 o'clock (narrowIndexAtTop).
 *
 * Tap (touch): pointerdown on a tangent hit button calls selectNarrowIndex
 * immediately — same path as mouse.
 *
 * Mouse click: pointerdown uses elementsFromPoint to find [data-narrow-nav-hit]
 * (full transformed hitbox, not SVG glyphs). Same selectNarrowIndex on down;
 * pointerup only releases capture. Movement past TAP_MOVE_PX converts to drag.
 *
 * Snap: selectNarrowIndex → snapNarrowToIndex. Base target from
 * narrowSnapRotation (lib/narrow-nav-ring.ts). Visual fine-tune via
 * narrowVisualSnapDelta after an instant base snap (no transition during
 * measure). Animated settle uses NARROW_SNAP_MS.
 *
 * Deterministic geometry (lib/narrow-nav-ring.ts)
 * -----------------------------------------------
 * Label arc spans use Chromium-measured word widths (NARROW_LABEL_WORD_WIDTH_PX)
 * + inter-label gap — not hand-tuned angles. One layout drives SVG ring,
 * hitboxes, and snap targets. Regenerate widths after typography changes:
 *   node scripts/measure-ring-widths.mjs
 *
 * iOS/Safari: measureLabelArcsFromTextPath via getSubStringLength; if spans
 * collapse (labelArcsAreUsable fails), falls back to the same deterministic
 * buildDeterministicNarrowLabelArcs() used everywhere else.
 *
 * Hitboxes: narrowHitOverlayRects() — tangent-oriented invisible buttons in
 * the rotator (rotation 0 coords; parent transform turns them).
 *
 * Related files: lib/narrow-nav-ring.ts (geometry, snap, overlays),
 * lib/narrow-stage.ts (artboard constants), scripts/measure-ring-widths.mjs.
 */

const LABELS = NARROW_NAV_LABELS;

/** Target arc length between consecutive slots on the wheel (px) */
const TARGET_ARC_SPACING_PX = 45;

/** Shift wheel center further left so the arc sits deeper off-screen (px) */
const ARC_OFFSET_BACK_PX = 300;
/** Extra left shift for project-page stage layout coords (menu “backed up”). */
const STAGE_ARC_EXTRA_BACK_LAYOUT_PX = 180;

type Item = { index: number; label: string };

function buildItems(repeats: number): Item[] {
  const total = LABELS.length * repeats;
  return Array.from({ length: total }, (_, i) => ({
    index: i,
    label: LABELS[i % LABELS.length]!,
  }));
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** Stable layout numbers for matching SSR + client markup */
function layoutRound(n: number) {
  return Math.round(n * 1000) / 1000;
}

function screenPosOnWheel(
  θ: number,
  φ: number,
  originX: number,
  originY: number,
  r: number
) {
  const lx = originX + r * Math.cos(θ);
  const ly = originY + r * Math.sin(θ);
  const dx = lx - originX;
  const dy = ly - originY;
  const c = Math.cos(φ);
  const s = Math.sin(φ);
  return {
    x: originX + dx * c - dy * s,
    y: originY + dx * s + dy * c,
  };
}

/** Snap rotation for item `i` closest to `current` (any real angle) so the wheel never wraps backward. */
function snapRotationForIndexContinuous(
  θ: number,
  current: number,
  viewportCenterX: number,
  originX: number,
  radius: number
) {
  const c = clamp((viewportCenterX - originX) / radius, -1, 1);
  const α = Math.acos(c);
  const bases = [-θ + α, -θ - α];
  let best = current;
  let bestDist = Infinity;
  for (const base of bases) {
    const k = Math.round((current - base) / (2 * Math.PI));
    const φ = base + k * 2 * Math.PI;
    const dist = Math.abs(φ - current);
    if (dist < bestDist) {
      bestDist = dist;
      best = φ;
    }
  }
  return best;
}

/** Tap if total finger travel from touchstart stays under this (px). */
const TAP_MOVE_PX = 8;

/** Walk the paint stack — finds tangent hit button under screen coords (mouse). */
function narrowHitIndexAtPoint(clientX: number, clientY: number): number | null {
  if (typeof document === "undefined") return null;
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    const hit = el.closest("[data-narrow-nav-hit]");
    if (!hit) continue;
    const idx = Number.parseInt(hit.getAttribute("data-narrow-nav-hit") ?? "", 10);
    if (idx >= 0 && idx < NARROW_NAV_LABELS.length) return idx;
  }
  return null;
}

/** Wheel / trackpad → radians per delta unit (narrow). */
const WHEEL_ROT_SCALE = 0.0022;
/** Idle after wheel before snapping to nearest slot (narrow). */
const WHEEL_SNAP_MS = 140;

/** Desktop: slower scroll + longer settle so trackpad does not skip labels. */
const DESKTOP_WHEEL_ROT_SCALE = 0.00075;
const DESKTOP_WHEEL_SNAP_MS = 400;
/** Desktop drag: dampen finger travel vs wheel angle. */
const DESKTOP_DRAG_GAIN = 0.62;
/** Desktop: keep current label unless another snap is clearly closer (rad). */
const DESKTOP_SNAP_HYSTERESIS_RAD = 0.085;

function nearestDesktopLabelSnap(
  φ: number,
  snapFn: (i: number, current: number) => number,
  tileCount: number,
  preferTileIndex?: number,
): { tileIndex: number; rotation: number } {
  const labelCount = LABELS.length;
  const perLabel: {
    label: number;
    tileIndex: number;
    cost: number;
    rotation: number;
  }[] = [];

  for (let label = 0; label < labelCount; label++) {
    let bestTile = label;
    let bestCost = Infinity;
    let bestRot = φ;
    for (let tile = label; tile < tileCount; tile += labelCount) {
      const rot = snapFn(tile, φ);
      const cost = Math.abs(rot - φ);
      if (cost < bestCost) {
        bestCost = cost;
        bestTile = tile;
        bestRot = rot;
      }
    }
    perLabel.push({
      label,
      tileIndex: bestTile,
      cost: bestCost,
      rotation: bestRot,
    });
  }

  let pick = perLabel.reduce((a, b) => (b.cost < a.cost ? b : a));

  if (preferTileIndex != null) {
    const preferLabel =
      ((preferTileIndex % labelCount) + labelCount) % labelCount;
    const prefer = perLabel.find((e) => e.label === preferLabel);
    if (
      prefer &&
      pick.cost > prefer.cost - DESKTOP_SNAP_HYSTERESIS_RAD
    ) {
      pick = prefer;
    }
  }

  return { tileIndex: pick.tileIndex, rotation: pick.rotation };
}
const NARROW_SNAP_MS = 380;

function initialNarrowRotation(
  initialActiveLabel: (typeof LABELS)[number] | undefined,
): number {
  const i = initialActiveLabel ? LABELS.indexOf(initialActiveLabel) : 0;
  const idx = i >= 0 ? i : 0;
  return narrowSnapRotation(idx, NARROW_BAKED_LABEL_ANGLES, 0);
}

export type CircularNavWheelProps = {
  onActiveLabelChange?: (label: string) => void;
  /** Fired when a nav item is hovered/focus-hovered (`null` when hover ends). Label is lowercase e.g. `"photos"`. */
  onHoverLabelChange?: (label: string | null) => void;
  /** True while the narrow wheel is dragging or coasting (live preview mode). */
  onWheelInteractingChange?: (interacting: boolean) => void;
  /** Section selected on first paint (wheel angle + focus). Default: first label (`about`). */
  initialActiveLabel?: (typeof LABELS)[number];
  /** Artboard_2: centered full circle; desktop: arc off left edge. */
  layout?: "desktop" | "narrow";
  /**
   * Desktop only.
   * - `"viewport"`: fixed full-bleed root (landing page).
   * - `"nav-zone"`: absolute root sized to the viewport for geometry, clipped by
   *   the shell’s left nav column (`overflow: hidden`).
   * - `"stage"`: absolute root locked to the 1440×811.5 layout inside the
   *   2875×1623 master artboard (scales with DesktopStageCanvas; no vw geometry).
   */
  containment?: "viewport" | "nav-zone" | "stage";
};

export function CircularNavWheel({
  onActiveLabelChange,
  onHoverLabelChange,
  onWheelInteractingChange,
  initialActiveLabel,
  layout = "desktop",
  containment = "viewport",
}: CircularNavWheelProps = {}) {
  const isNarrow = layout === "narrow";
  const ringLayout = useNarrowRingLayout(isNarrow);
  const labelAngles = ringLayout.labelAngles;
  const labelArcs = ringLayout.labelArcs;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [rotation, setRotation] = useState(() =>
    layout === "narrow" ? initialNarrowRotation(initialActiveLabel) : 0,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  /** True for full narrow snap pipeline — suppresses fill cross-fade ghosting. */
  const [narrowSnapActive, setNarrowSnapActive] = useState(false);
  const [hitOverlays, setHitOverlays] = useState<
    ReturnType<typeof narrowHitOverlayRects>
  >([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(() => {
    if (!initialActiveLabel) return 0;
    const i = LABELS.indexOf(initialActiveLabel);
    return i >= 0 ? i : 0;
  });
  const [reduceMotion, setReduceMotion] = useState(false);
  const focusedRef = useRef(0);
  focusedRef.current = focusedIndex;
  const rotationRef = useRef(0);
  rotationRef.current = rotation;
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;
  const isNarrowRef = useRef(isNarrow);
  isNarrowRef.current = isNarrow;
  const labelAnglesRef = useRef(labelAngles);
  labelAnglesRef.current = labelAngles;
  const labelArcsRef = useRef(labelArcs);
  labelArcsRef.current = labelArcs;
  const ringMetricsRef = useRef({
    ox: NARROW_WHEEL_CENTER.x,
    oy: NARROW_WHEEL_CENTER.y,
    r: ringLayout.radius,
  });
  const onLabelRef = useRef(onActiveLabelChange);
  onLabelRef.current = onActiveLabelChange;
  const onHoverLabelRef = useRef(onHoverLabelChange);
  onHoverLabelRef.current = onHoverLabelChange;
  const onWheelInteractingRef = useRef(onWheelInteractingChange);
  onWheelInteractingRef.current = onWheelInteractingChange;
  const isWheelInteractingRef = useRef(false);

  const setWheelInteracting = useCallback((active: boolean) => {
    if (isWheelInteractingRef.current === active) return;
    isWheelInteractingRef.current = active;
    onWheelInteractingRef.current?.(active);
  }, []);

  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastAngle: 0,
    moved: false,
  });
  /** Narrow hit — touch + mouse: select on pointerdown; pointerup cleans up only. */
  const hitTapRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const snapTimeoutRef = useRef<number | null>(null);
  const snapGenerationRef = useRef(0);

  const clearNarrowDragState = useCallback(() => {
    dragRef.current.pointerId = -1;
    dragRef.current.moved = false;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const stageView = useContext(DesktopStageViewContext);
  const useNavZoneContainment = !isNarrow && containment === "nav-zone";
  const useStageContainment = !isNarrow && containment === "stage";
  const useClippedDesktopRoot = useNavZoneContainment || useStageContainment;
  const stageWheelH = useStageContainment
    ? stageView.wheelLayoutH
    : DESKTOP_LAYOUT_H;

  useEffect(() => {
    if (isNarrow) {
      setSize({ w: NARROW_W, h: NARROW_H });
      return;
    }
    if (useStageContainment) {
      setSize({ w: DESKTOP_LAYOUT_W, h: stageWheelH });
      return;
    }
    if (useNavZoneContainment) {
      const read = () => {
        setSize({
          w: window.innerWidth || 1200,
          h: window.innerHeight || 800,
        });
      };
      read();
      window.addEventListener("resize", read);
      return () => window.removeEventListener("resize", read);
    }
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        w: rect.width || window.innerWidth,
        h: rect.height || window.innerHeight,
      });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener("resize", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [isNarrow, useNavZoneContainment, useStageContainment, stageWheelH]);

  const { w, h } = size;
  const arcSpacing = TARGET_ARC_SPACING_PX;
  /**
   * Stage layout is scaled into the 2875 master. Use the landing wheel’s
   * master-space origin, expressed in layout coordinates, so the menu keeps
   * the same off-axis relationship after the uniform ×2 layout scale.
   */
  const originX = isNarrow
    ? NARROW_WHEEL_CENTER.x
    : useStageContainment
      ? (-0.22 * DESKTOP_STAGE_W - ARC_OFFSET_BACK_PX) / DESKTOP_LAYOUT_SCALE -
        STAGE_ARC_EXTRA_BACK_LAYOUT_PX
      : -0.22 * w - ARC_OFFSET_BACK_PX;
  const originY = isNarrow ? NARROW_WHEEL_CENTER.y : h / 2;
  const r = isNarrow
    ? ringLayout.radius
    : useStageContainment
      ? Math.min(DESKTOP_LAYOUT_W, DESKTOP_LAYOUT_H) * 0.88
      : Math.min(w, h) * 0.88;
  ringMetricsRef.current = { ox: originX, oy: originY, r };

  /* Narrow: one label per slot on the ring; desktop: tile repeats for arc density. */
  const repeats = isNarrow
    ? 1
    : Math.max(
        1,
        Math.round((2 * Math.PI * r) / (arcSpacing * LABELS.length)),
      );
  const items = useMemo(() => buildItems(repeats), [repeats]);
  const N = items.length;

  /** Stable primitive for layout-effect deps — never pass labelArcs array directly. */
  const labelArcsVersion = useMemo(
    () =>
      labelArcs
        .map(
          (a) =>
            `${a.center.toFixed(5)}:${a.pathStart.toFixed(2)}:${a.pathEnd.toFixed(2)}`,
        )
        .join("|"),
    [labelArcs],
  );

  const baseAngle = useCallback(
    (i: number) => {
      if (isNarrow) {
        return narrowLabelAngle(i, labelAngles);
      }
      return -Math.PI / 2 + (2 * Math.PI * i) / N;
    },
    [N, labelAngles, isNarrow],
  );

  const snapRotationForIndex = useCallback(
    (i: number, current: number) => {
      if (isNarrow) {
        return narrowSnapRotation(i, labelAngles, current);
      }
      const θ = baseAngle(i);
      return snapRotationForIndexContinuous(θ, current, w / 2, originX, r);
    },
    [baseAngle, isNarrow, labelAngles, originX, r, w],
  );

  const nearestIndexToPointer = useCallback(
    (clientX: number, clientY: number, φ: number) => {
      let best = 0;
      let bestScore = Infinity;
      for (let i = 0; i < N; i++) {
        const θ = baseAngle(i);
        const p = screenPosOnWheel(θ, φ, originX, originY, r);
        const d = Math.hypot(clientX - p.x, clientY - p.y);
        if (d < bestScore) {
          bestScore = d;
          best = i;
        }
      }
      return best;
    },
    [baseAngle, originX, originY, r, N]
  );

  const NRef = useRef(N);
  NRef.current = N;
  const snapRotationForIndexRef = useRef(snapRotationForIndex);
  snapRotationForIndexRef.current = snapRotationForIndex;

  const updateHitOverlays = useCallback(() => {
    if (!isNarrowRef.current) return;
    const { ox, oy, r: radius } = ringMetricsRef.current;
    const overlays = narrowHitOverlayRects(
      0,
      labelArcsRef.current,
      ox,
      oy,
      radius,
      NARROW_LABEL_BAND_PX,
    );
    setHitOverlays(overlays);
  }, []);

  const updateHitOverlaysRef = useRef(updateHitOverlays);
  updateHitOverlaysRef.current = updateHitOverlays;

  const snapNarrowToIndex = useCallback(
    (index: number, current = rotationRef.current) => {
      const gen = ++snapGenerationRef.current;
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = null;
      }
      setNarrowSnapActive(true);
      const baseSnap = snapRotationForIndex(index, current);

      // Jump to base snap instantly (no transition) so DOM matches state before measuring.
      setIsSnapping(false);
      setRotation(baseSnap);
      rotationRef.current = baseSnap;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (gen !== snapGenerationRef.current) return;

          let finalRotation = baseSnap;
          const delta = narrowVisualSnapDelta(index, wrapRef.current);
          if (Math.abs(delta) >= 0.0004) {
            finalRotation = baseSnap + delta;
          }

          rotationRef.current = finalRotation;
          setIsSnapping(true);
          setRotation(finalRotation);

          snapTimeoutRef.current = window.setTimeout(() => {
            if (gen !== snapGenerationRef.current) return;
            snapTimeoutRef.current = null;
            setIsSnapping(false);
            setNarrowSnapActive(false);
          }, NARROW_SNAP_MS);
        });
      });
    },
    [snapRotationForIndex],
  );

  const snapNarrowToIndexRef = useRef(snapNarrowToIndex);
  snapNarrowToIndexRef.current = snapNarrowToIndex;

  const selectNarrowIndex = useCallback(
    (index: number, current = rotationRef.current) => {
      setHoveredIndex(null);
      setFocusedIndex(index);
      snapNarrowToIndex(index, current);
    },
    [snapNarrowToIndex],
  );

  const syncNarrowTopHover = useCallback((φ: number) => {
    const top = narrowIndexAtTop(φ, labelAnglesRef.current);
    setHoveredIndex((prev) => (prev === top ? prev : top));
  }, []);

  const finishNarrowSpin = useCallback(() => {
    const φ = rotationRef.current;
    const bestI = narrowIndexAtTop(φ, labelAnglesRef.current);
    selectNarrowIndex(bestI, φ);
    setWheelInteracting(false);
  }, [selectNarrowIndex, setWheelInteracting]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let idle: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (isDraggingRef.current) return;
      e.preventDefault();
      const rotScale = isNarrowRef.current
        ? WHEEL_ROT_SCALE
        : DESKTOP_WHEEL_ROT_SCALE;
      setRotation((prev) => prev + e.deltaY * rotScale);
      if (idle) clearTimeout(idle);
      const snapMs = isNarrowRef.current
        ? WHEEL_SNAP_MS
        : DESKTOP_WHEEL_SNAP_MS;
      idle = setTimeout(() => {
        idle = null;
        const φ = rotationRef.current;
        const snapFn = snapRotationForIndexRef.current;
        const n = NRef.current;
        if (isNarrowRef.current) {
          const bestI = narrowIndexAtTop(φ, labelAnglesRef.current);
          setFocusedIndex(bestI);
          return;
        }
        const { tileIndex, rotation: nextRot } = nearestDesktopLabelSnap(
          φ,
          snapFn,
          n,
          focusedRef.current,
        );
        setFocusedIndex(tileIndex);
        setRotation(nextRot);
      }, snapMs);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (idle) clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    setFocusedIndex((i) => clamp(i, 0, N - 1));
  }, [N]);

  useEffect(() => {
    const label = items[focusedIndex]?.label ?? "";
    onLabelRef.current?.(label);
  }, [focusedIndex, items]);

  useEffect(() => {
    const label =
      hoveredIndex != null ? (items[hoveredIndex]?.label ?? null) : null;
    onHoverLabelRef.current?.(label);
  }, [hoveredIndex, items]);

  /** Drop stale desktop hover after drag/keyboard changes focus away from hovered item. */
  useEffect(() => {
    if (isNarrow || isDragging) return;
    setHoveredIndex((prev) =>
      prev !== null && prev !== focusedIndex ? null : prev,
    );
  }, [focusedIndex, isDragging, isNarrow]);

  /** Stable primitive — never pass labelAngles array into effect deps. */
  const layoutSnapKey = `${isNarrow}:${ringLayout.ready}:${labelArcsVersion}`;
  const layoutSnappedKeyRef = useRef("");

  useLayoutEffect(() => {
    if (!isNarrow || isDraggingRef.current || !ringLayout.ready) return;
    if (layoutSnappedKeyRef.current === layoutSnapKey) return;
    layoutSnappedKeyRef.current = layoutSnapKey;
    snapNarrowToIndexRef.current(focusedRef.current, rotationRef.current);
  }, [layoutSnapKey]);

  /** Tap overlays are authored at rotation 0; the rotator wrapper applies wheel angle. */
  useLayoutEffect(() => {
    if (!isNarrow || !ringLayout.ready) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => updateHitOverlays());
    });
  }, [isNarrow, ringLayout.ready, labelArcsVersion, updateHitOverlays]);

  useEffect(() => {
    if (!isNarrow) return;
    const onResize = () => {
      if (isDraggingRef.current) return;
      updateHitOverlaysRef.current();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isNarrow]);

  useEffect(
    () => () => {
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
      setWheelInteracting(false);
      setNarrowSnapActive(false);
    },
    [setWheelInteracting],
  );

  useEffect(() => {
    if (isNarrow) return;
    setRotation((prev) =>
      snapRotationForIndex(focusedRef.current, prev),
    );
  }, [isNarrow, w, h, snapRotationForIndex, labelAngles, ringLayout.radius]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const el = e.target;
      if (
        el instanceof Element &&
        el.closest("input, textarea, select, [contenteditable=true]")
      ) {
        return;
      }
      if (isDraggingRef.current) return;
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const n = N;
      const next = (((focusedRef.current + delta) % n) + n) % n;
      setHoveredIndex(null);
      if (isNarrow) {
        selectNarrowIndex(next, rotationRef.current);
      } else {
        setFocusedIndex(next);
        setRotation((prev) => snapRotationForIndex(next, prev));
      }
      queueMicrotask(() => {
        document
          .getElementById(`circular-nav-item-${next}`)
          ?.focus({ preventScroll: true });
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [N, isNarrow, selectNarrowIndex, snapRotationForIndex]);

  const onItemEnter = (i: number) => {
    setHoveredIndex(i);
    if (!isDragging && !isNarrow) {
      const nextLabel = i % LABELS.length;
      const curLabel = focusedRef.current % LABELS.length;
      if (nextLabel !== curLabel) {
        setFocusedIndex(i);
        setRotation((prev) => snapRotationForIndex(i, prev));
      }
    }
  };

  /** Desktop: keep hover while the snapped item stays focused (label moves under cursor on rotate). */
  const onItemLeave = (i: number) => {
    if (isNarrow) {
      setHoveredIndex(null);
      return;
    }
    setHoveredIndex((prev) => (focusedRef.current === i ? i : null));
  };

  const pointerLocal = (clientX: number, clientY: number) => {
    if (!isNarrow && !useStageContainment) {
      return { x: clientX, y: clientY };
    }
    const el = wrapRef.current;
    if (!el) return { x: clientX, y: clientY };
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return { x: clientX, y: clientY };
    }
    const localW = useStageContainment ? DESKTOP_LAYOUT_W : NARROW_W;
    const localH = useStageContainment ? stageWheelH : NARROW_H;
    return {
      x: ((clientX - rect.left) / rect.width) * localW,
      y: ((clientY - rect.top) / rect.height) * localH,
    };
  };

  const onPointerDownCapture = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isNarrow) {
      const idx =
        e.pointerType === "mouse"
          ? narrowHitIndexAtPoint(e.clientX, e.clientY)
          : e.target instanceof Element
            ? (() => {
                const hitEl = e.target.closest("[data-narrow-nav-hit]");
                if (!hitEl) return null;
                const i = Number.parseInt(
                  hitEl.getAttribute("data-narrow-nav-hit") ?? "",
                  10,
                );
                return i >= 0 && i < NARROW_NAV_LABELS.length ? i : null;
              })()
            : null;

      if (idx != null) {
        const el = wrapRef.current;
        hitTapRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
        };
        el?.setPointerCapture(e.pointerId);
        selectNarrowIndex(idx, rotationRef.current);
        return;
      }
    }
    const el = wrapRef.current;
    if (!el) return;
    setIsSnapping(false);
    setWheelInteracting(true);
    const p = pointerLocal(e.clientX, e.clientY);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastAngle: Math.atan2(p.y - originY, p.x - originX),
      moved: false,
    };
    isDraggingRef.current = true;
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const pendingHit = hitTapRef.current;
    if (pendingHit && pendingHit.pointerId === e.pointerId) {
      const travel = Math.hypot(
        e.clientX - pendingHit.startX,
        e.clientY - pendingHit.startY,
      );
      if (travel < TAP_MOVE_PX) return;

      hitTapRef.current = null;
      setIsSnapping(false);
      setWheelInteracting(true);
      const p = pointerLocal(e.clientX, e.clientY);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: pendingHit.startX,
        startY: pendingHit.startY,
        lastAngle: Math.atan2(p.y - originY, p.x - originX),
        moved: true,
      };
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    if (dragRef.current.pointerId !== e.pointerId) return;

    const p = pointerLocal(e.clientX, e.clientY);
    const angle = Math.atan2(p.y - originY, p.x - originX);
    let delta = angle - dragRef.current.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    dragRef.current.lastAngle = angle;

    if (!dragRef.current.moved) {
      const travel = Math.hypot(
        e.clientX - dragRef.current.startX,
        e.clientY - dragRef.current.startY,
      );
      if (travel < TAP_MOVE_PX) return;
      dragRef.current.moved = true;
    }

    setRotation((prev) => {
      const applied = isNarrow ? delta : delta * DESKTOP_DRAG_GAIN;
      const next = prev + applied;
      rotationRef.current = next;
      if (isNarrow) {
        syncNarrowTopHover(next);
      }
      return next;
    });
  };

  const endPointer = (e: React.PointerEvent) => {
    const pendingHit = hitTapRef.current;
    if (pendingHit && pendingHit.pointerId === e.pointerId) {
      hitTapRef.current = null;
      try {
        wrapRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      setWheelInteracting(false);
      return;
    }

    if (dragRef.current.pointerId !== e.pointerId) return;

    const pid = e.pointerId;

    try {
      wrapRef.current?.releasePointerCapture(pid);
    } catch {
      /* noop */
    }

    const wasDragging = isDraggingRef.current;
    clearNarrowDragState();

    const φ = rotationRef.current;

    const travel = Math.hypot(
      e.clientX - dragRef.current.startX,
      e.clientY - dragRef.current.startY,
    );
    const isTap = travel < TAP_MOVE_PX;

    if (isTap) {
      if (isNarrow) {
        setWheelInteracting(false);
      } else {
        const p = pointerLocal(e.clientX, e.clientY);
        const i = nearestIndexToPointer(p.x, p.y, φ);
        setFocusedIndex(i);
        setRotation((prev) => snapRotationForIndex(i, prev));
      }
    } else if (isNarrow && wasDragging) {
      finishNarrowSpin();
    } else {
      const { tileIndex, rotation: nextRot } = nearestDesktopLabelSnap(
        φ,
        snapRotationForIndex,
        N,
        focusedRef.current,
      );
      setFocusedIndex(tileIndex);
      setRotation(nextRot);
    }

    dragRef.current.moved = false;
  };

  const transitionMs = reduceMotion ? 60 : 520;

  const ox = layoutRound(originX);
  const oy = layoutRound(originY);
  const rotDeg = layoutRound((rotation * 180) / Math.PI);

  const narrowRingPath = narrowRingPathD(r);
  const hitOverlaysActive =
    isNarrow && ringLayout.ready && !isDragging && !isSnapping;

  /** Narrow: during snap, hot label follows 12 o'clock — not focusedIndex alone. */
  const narrowHotIndex =
    hoveredIndex !== null
      ? hoveredIndex
      : narrowSnapActive
        ? narrowIndexAtTop(rotation, labelAngles)
        : focusedIndex;

  const desktopRootClass = useClippedDesktopRoot
    ? "absolute left-0 top-0 touch-none select-none bg-transparent"
    : isNarrow
      ? "absolute inset-0 touch-none select-none bg-transparent"
      : "fixed inset-0 touch-none select-none bg-white";

  return (
    <div
      ref={wrapRef}
      className={desktopRootClass}
      style={{
        zIndex: isNarrow ? 10 : 1,
        touchAction: "none",
        ...(useStageContainment
          ? {
              width: DESKTOP_LAYOUT_W,
              height: stageWheelH,
              top: (DESKTOP_LAYOUT_H - stageWheelH) / 2,
            }
          : useNavZoneContainment
            ? {
                width: "100vw",
                height: "100vh",
              }
            : null),
      }}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      {isNarrow ? (
        <div
          className="absolute left-0 top-0"
          style={{
            width: NARROW_W,
            height: NARROW_H,
            transform: `rotate(${rotDeg}deg)`,
            transformOrigin: `${ox}px ${oy}px`,
            transition:
              isDragging || reduceMotion
                ? "none"
                : isSnapping
                  ? `transform ${NARROW_SNAP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                  : "none",
          }}
        >
        <svg
          className="absolute inset-0 overflow-visible"
          width={NARROW_W}
          height={NARROW_H}
          viewBox={`0 0 ${NARROW_W} ${NARROW_H}`}
          aria-label="Portfolio sections"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <path id="narrow-nav-ring" d={narrowRingPath} fill="none" />
          </defs>
          <g
            style={{
              opacity: ringLayout.ready ? 1 : 0,
              transition:
                isDragging || reduceMotion ? "none" : "opacity 0.15s ease",
            }}
          >
            <text
              fontFamily='"Arial MT Std", Arial, Helvetica, sans-serif'
              fontSize={`${ringLayout.fontSizePt}pt`}
              fontWeight={800}
              xmlSpace="preserve"
              style={{
                textTransform: "lowercase",
                letterSpacing: `${NARROW_LABEL_TRACKING_EM}em`,
                pointerEvents: "none",
              }}
            >
              <textPath
                href="#narrow-nav-ring"
                xlinkHref="#narrow-nav-ring"
                startOffset={0}
                xmlSpace="preserve"
              >
                {NARROW_NAV_LABELS.map((label, i) => {
                  const isHot = narrowHotIndex === i;
                  return (
                    <Fragment key={label}>
                      <tspan
                        id={`circular-nav-item-${i}`}
                        fill={isHot ? NARROW_LABEL_ACTIVE : NARROW_LABEL_INACTIVE}
                        fontWeight={800}
                        style={{
                          transition:
                            reduceMotion || narrowSnapActive
                              ? "none"
                              : "fill 0.18s ease",
                          pointerEvents: "none",
                        }}
                      >
                        {ringWordText(i)}
                      </tspan>
                      {" "}
                    </Fragment>
                  );
                })}
              </textPath>
            </text>
          </g>
        </svg>
        <div
          className="pointer-events-none absolute left-0 top-0 z-[1]"
          style={{ width: NARROW_W, height: NARROW_H }}
          aria-hidden
        >
          {hitOverlays.map((o) => (
            <button
              key={o.index}
              type="button"
              data-narrow-nav-hit={o.index}
              aria-label={NARROW_NAV_LABELS[o.index]}
              className="absolute m-0 border-none bg-transparent p-0"
              onClick={(e) => {
                e.preventDefault();
              }}
              style={{
                left: o.centerX,
                top: o.centerY,
                width: o.width,
                height: o.height,
                zIndex: o.index + 1,
                transform: `translate(-50%, -50%) rotate(${(o.angleRad * 180) / Math.PI + 90}deg)`,
                transformOrigin: "center center",
                opacity: 0,
                backgroundColor: "rgba(0, 0, 0, 0.001)",
                pointerEvents: hitOverlaysActive ? "auto" : "none",
              }}
            />
          ))}
        </div>
        </div>
      ) : (
        <div
          className="absolute inset-0 overflow-visible"
          style={{
            transform: `rotate(${layoutRound(rotation)}rad)`,
            transformOrigin: `${ox}px ${oy}px`,
            transition:
              isDragging || reduceMotion
                ? "none"
                : `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
          aria-label="Portfolio sections"
        >
          {items.map((item) => {
            const θ = baseAngle(item.index);
            const x = layoutRound(originX + r * Math.cos(θ));
            const y = layoutRound(originY + r * Math.sin(θ));
            const itemRotDeg = layoutRound((θ * 180) / Math.PI);

            const isHot =
              hoveredIndex === item.index ||
              (hoveredIndex === null && focusedIndex === item.index);

            return (
              <span
                key={`${repeats}-${item.index}`}
                className="pointer-events-none absolute"
                style={{
                  left: x,
                  top: y,
                  transform: "translateY(-50%)",
                }}
              >
                <button
                  id={`circular-nav-item-${item.index}`}
                  type="button"
                  className="pointer-events-auto block cursor-pointer whitespace-nowrap border-none bg-transparent p-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-400"
                  style={{
                    transform: `rotate(${itemRotDeg}deg)`,
                    transformOrigin: "left center",
                    fontFamily: '"Arial MT Std", Arial, Helvetica, sans-serif',
                    fontWeight: 800,
                    fontSize: useStageContainment
                      ? DESKTOP_STAGE_LABEL_FONT_SIZE
                      : "clamp(1.62rem, 4.32vw, 2.88rem)",
                    letterSpacing: "-0.06em",
                    textTransform: "lowercase",
                    color: isHot ? "#000000" : "#a3a3a3",
                    transition: reduceMotion ? "none" : "color 0.18s ease",
                  }}
                  onMouseEnter={() => onItemEnter(item.index)}
                  onMouseLeave={() => onItemLeave(item.index)}
                  onFocus={() => {
                    setFocusedIndex(item.index);
                    setHoveredIndex(item.index);
                    if (!isDragging) {
                      setRotation((prev) =>
                        snapRotationForIndex(item.index, prev),
                      );
                    }
                  }}
                  onBlur={() => onItemLeave(item.index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onItemEnter(item.index);
                    }
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                    }
                  }}
                >
                  {item.label}
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
