"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { narrowRingPathD } from "@/lib/narrow-nav-ring";
import {
  NARROW_H,
  NARROW_LABEL_ACTIVE,
  NARROW_LABEL_INACTIVE,
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

/** Target arc length between consecutive slots on the wheel (px) */
const TARGET_ARC_SPACING_PX = 45;

/** Shift wheel center further left so the arc sits deeper off-screen (px) */
const ARC_OFFSET_BACK_PX = 300;

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

/** Narrow: snap focused label to 12 o'clock on the hub (Artboard_2). */
function snapRotationForIndexNarrow(θ: number, current: number) {
  const target = -Math.PI / 2 - θ;
  const k = Math.round((current - target) / (2 * Math.PI));
  return target + k * 2 * Math.PI;
}

const DRAG_MOVE_RAD = 0.04;
const TAP_MOVE_PX = 10;
/** Wheel / trackpad → radians per delta unit */
const WHEEL_ROT_SCALE = 0.0022;
/** Idle after wheel before snapping to nearest slot */
const WHEEL_SNAP_MS = 140;

const NARROW_LABEL_COUNT = LABELS.length;
const NARROW_STEP_RAD = (2 * Math.PI) / NARROW_LABEL_COUNT;
const NARROW_TAP_THRESHOLD_PX = 8;
const NARROW_SNAP_MS = 350;

/** Rotation (rad) that places label `index` at 12 o'clock — even 360/N slots. */
function narrowRotationForIndex(index: number): number {
  return -(index * NARROW_STEP_RAD);
}

/** Which label sits nearest the top marker at `rotationRad`. */
function narrowIndexAtRotation(rotationRad: number): number {
  const raw = Math.round(-rotationRad / NARROW_STEP_RAD);
  return ((raw % NARROW_LABEL_COUNT) + NARROW_LABEL_COUNT) % NARROW_LABEL_COUNT;
}

function initialNarrowRotation(
  initialActiveLabel: (typeof LABELS)[number] | undefined,
): number {
  const i = initialActiveLabel ? LABELS.indexOf(initialActiveLabel) : 0;
  return narrowRotationForIndex(i >= 0 ? i : 0);
}

function narrowTapIndex(clientX: number, clientY: number): number | null {
  if (typeof document === "undefined") return null;
  const el = document.elementFromPoint(clientX, clientY);
  if (!el || !(el instanceof Element)) return null;
  const hit = el.closest("[data-nav-index]");
  if (!hit) return null;
  const i = Number.parseInt(hit.getAttribute("data-nav-index") ?? "", 10);
  return i >= 0 && i < NARROW_LABEL_COUNT ? i : null;
}

function angleDegFromWrapCenter(
  clientX: number,
  clientY: number,
  wrap: HTMLElement,
): number {
  const rect = wrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
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
};

export function CircularNavWheel({
  onActiveLabelChange,
  onHoverLabelChange,
  onWheelInteractingChange,
  initialActiveLabel,
  layout = "desktop",
}: CircularNavWheelProps = {}) {
  const isNarrow = layout === "narrow";
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [rotation, setRotation] = useState(() =>
    layout === "narrow" ? initialNarrowRotation(initialActiveLabel) : 0,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
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
    downX: 0,
    downY: 0,
    moved: false,
    dragStartAngleDeg: 0,
    rotationAtDragStart: 0,
    lastAngle: 0,
    cumMovePx: 0,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
    if (isNarrow) {
      setSize({ w: NARROW_W, h: NARROW_H });
      return;
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
  }, [isNarrow]);

  const { w, h } = size;
  const arcSpacing = TARGET_ARC_SPACING_PX;
  const originX = isNarrow
    ? NARROW_WHEEL_CENTER.x
    : -0.22 * w - ARC_OFFSET_BACK_PX;
  const originY = isNarrow ? NARROW_WHEEL_CENTER.y : h / 2;
  const r = isNarrow ? NARROW_WHEEL_R : Math.min(w, h) * 0.88;

  /* Narrow: one label per slot on the ring; desktop: tile repeats for arc density. */
  const repeats = isNarrow
    ? 1
    : Math.max(
        1,
        Math.round((2 * Math.PI * r) / (arcSpacing * LABELS.length)),
      );
  const items = useMemo(() => buildItems(repeats), [repeats]);
  const N = items.length;

  const baseAngle = useCallback(
    (i: number) => {
      if (isNarrow) {
        return -Math.PI / 2 + (2 * Math.PI * i) / NARROW_LABEL_COUNT;
      }
      return -Math.PI / 2 + (2 * Math.PI * i) / N;
    },
    [N, isNarrow],
  );

  const snapRotationForIndex = useCallback(
    (i: number, current: number) => {
      const θ = baseAngle(i);
      if (isNarrow) {
        return snapRotationForIndexNarrow(θ, current);
      }
      return snapRotationForIndexContinuous(θ, current, w / 2, originX, r);
    },
    [baseAngle, isNarrow, originX, r, w],
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

  const snapNarrowToIndex = useCallback((index: number) => {
    setHoveredIndex(null);
    setFocusedIndex(index);
    setIsSnapping(true);
    const next = narrowRotationForIndex(index);
    setRotation(next);
    rotationRef.current = next;
    window.setTimeout(() => setIsSnapping(false), NARROW_SNAP_MS);
  }, []);

  const selectNarrowIndex = useCallback(
    (index: number) => {
      snapNarrowToIndex(index);
    },
    [snapNarrowToIndex],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let idle: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (isDraggingRef.current) return;
      e.preventDefault();
      setRotation((prev) => prev + e.deltaY * WHEEL_ROT_SCALE);
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => {
        idle = null;
        const φ = rotationRef.current;
        const snapFn = snapRotationForIndexRef.current;
        const n = NRef.current;
        if (isNarrowRef.current) {
          const bestI = narrowIndexAtRotation(φ);
          setFocusedIndex(bestI);
          setRotation(narrowRotationForIndex(bestI));
          return;
        }
        let bestI = 0;
        let bestCost = Infinity;
        for (let i = 0; i < n; i++) {
          const snap = snapFn(i, φ);
          const cost = Math.abs(snap - φ);
          if (cost < bestCost) {
            bestCost = cost;
            bestI = i;
          }
        }
        setFocusedIndex(bestI);
        setRotation(snapFn(bestI, φ));
      }, WHEEL_SNAP_MS);
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

  useEffect(() => {
    if (isNarrow) return;
    setRotation((prev) =>
      snapRotationForIndex(focusedRef.current, prev),
    );
  }, [isNarrow, w, h, snapRotationForIndex]);

  useEffect(
    () => () => {
      setWheelInteracting(false);
    },
    [setWheelInteracting],
  );

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
        selectNarrowIndex(next);
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
    setFocusedIndex(i);
    if (!isDragging && !isNarrow) {
      setRotation((prev) => snapRotationForIndex(i, prev));
    }
  };

  const onItemLeave = () => setHoveredIndex(null);

  const onPointerDownCapture = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = wrapRef.current;
    if (!el) return;
    setIsSnapping(false);
    setWheelInteracting(true);

    if (isNarrow) {
      dragRef.current = {
        ...dragRef.current,
        pointerId: e.pointerId,
        downX: e.clientX,
        downY: e.clientY,
        moved: false,
        dragStartAngleDeg: angleDegFromWrapCenter(e.clientX, e.clientY, el),
        rotationAtDragStart: rotationRef.current,
      };
    } else {
      dragRef.current = {
        ...dragRef.current,
        pointerId: e.pointerId,
        lastAngle: Math.atan2(e.clientY - originY, e.clientX - originX),
        cumMovePx: 0,
        moved: false,
      };
    }

    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return;

    if (isNarrow) {
      const el = wrapRef.current;
      if (!el) return;

      if (!dragRef.current.moved) {
        const dist = Math.hypot(
          e.clientX - dragRef.current.downX,
          e.clientY - dragRef.current.downY,
        );
        if (dist <= NARROW_TAP_THRESHOLD_PX) return;
        dragRef.current.moved = true;
      }

      const currentAngleDeg = angleDegFromWrapCenter(
        e.clientX,
        e.clientY,
        el,
      );
      const deltaDeg = currentAngleDeg - dragRef.current.dragStartAngleDeg;
      const next =
        dragRef.current.rotationAtDragStart + (deltaDeg * Math.PI) / 180;
      setRotation(next);
      rotationRef.current = next;
      setHoveredIndex(narrowIndexAtRotation(next));
      return;
    }

    const angle = Math.atan2(e.clientY - originY, e.clientX - originX);
    let delta = angle - dragRef.current.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    dragRef.current.lastAngle = angle;

    if (!dragRef.current.moved) {
      dragRef.current.cumMovePx += Math.hypot(e.movementX, e.movementY);
      if (
        dragRef.current.cumMovePx <= TAP_MOVE_PX &&
        Math.abs(delta) <= DRAG_MOVE_RAD
      ) {
        return;
      }
      dragRef.current.moved = true;
    }

    setRotation((prev) => prev + delta);
  };

  const endPointer = (e: React.PointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return;

    const wasMoved = dragRef.current.moved;
    const pid = e.pointerId;

    try {
      wrapRef.current?.releasePointerCapture(pid);
    } catch {
      /* noop */
    }

    dragRef.current.pointerId = -1;
    setIsDragging(false);

    if (isNarrow) {
      if (!wasMoved) {
        const tapped = narrowTapIndex(e.clientX, e.clientY);
        if (tapped != null) {
          snapNarrowToIndex(tapped);
        }
      } else {
        snapNarrowToIndex(narrowIndexAtRotation(rotationRef.current));
      }
      setWheelInteracting(false);
    } else if (!wasMoved) {
      const i = nearestIndexToPointer(e.clientX, e.clientY, rotationRef.current);
      setFocusedIndex(i);
      setRotation((prev) => snapRotationForIndex(i, prev));
    } else {
      const φ = rotationRef.current;
      let bestI = 0;
      let bestCost = Infinity;
      for (let i = 0; i < N; i++) {
        const snap = snapRotationForIndex(i, φ);
        const cost = Math.abs(snap - φ);
        if (cost < bestCost) {
          bestCost = cost;
          bestI = i;
        }
      }
      setFocusedIndex(bestI);
      setRotation(snapRotationForIndex(bestI, φ));
    }

    dragRef.current.moved = false;
    dragRef.current.cumMovePx = 0;
  };

  const transitionMs = reduceMotion ? 60 : 520;

  const ox = layoutRound(originX);
  const oy = layoutRound(originY);
  const rotDeg = layoutRound((rotation * 180) / Math.PI);

  const narrowRingPath = narrowRingPathD(NARROW_WHEEL_R);

  return (
    <div
      ref={wrapRef}
      className={`${isNarrow ? "absolute inset-0" : "fixed inset-0"} touch-none select-none ${isNarrow ? "bg-transparent" : "bg-white"}`}
      style={{ zIndex: isNarrow ? 10 : 1, touchAction: "none" }}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      {isNarrow ? (
        <svg
          className="absolute inset-0 overflow-visible"
          width={NARROW_W}
          height={NARROW_H}
          viewBox={`0 0 ${NARROW_W} ${NARROW_H}`}
          aria-label="Portfolio sections"
        >
          <defs>
            <path id="narrow-nav-ring" d={narrowRingPath} fill="none" />
          </defs>
          <g
            style={{
              transform: `rotate(${rotDeg}deg)`,
              transformOrigin: `${ox}px ${oy}px`,
              transition:
                isDragging || reduceMotion
                  ? "none"
                  : isSnapping
                    ? `transform ${NARROW_SNAP_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
                    : "none",
            }}
          >
            {LABELS.map((label, i) => {
              const isHot =
                hoveredIndex === i ||
                (hoveredIndex === null && focusedIndex === i);
              return (
                <text
                  key={label}
                  id={`circular-nav-item-${i}`}
                  data-nav-index={i}
                  fontFamily='"Arial MT Std", Arial, Helvetica, sans-serif'
                  fontSize={`${NARROW_RING_FONT_SIZE_PT}pt`}
                  fontWeight={800}
                  fill={isHot ? NARROW_LABEL_ACTIVE : NARROW_LABEL_INACTIVE}
                  style={{
                    textTransform: "lowercase",
                    letterSpacing: `${NARROW_LABEL_TRACKING_EM}em`,
                    pointerEvents: "visiblePainted",
                    transition: reduceMotion ? "none" : "fill 0.18s ease",
                  }}
                >
                  <textPath
                    href="#narrow-nav-ring"
                    xlinkHref="#narrow-nav-ring"
                    startOffset={`${(i / NARROW_LABEL_COUNT) * 100}%`}
                    textAnchor="middle"
                  >
                    {label}
                  </textPath>
                </text>
              );
            })}
          </g>
        </svg>
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
                    fontSize: "clamp(1.62rem, 4.32vw, 2.88rem)",
                    letterSpacing: "-0.06em",
                    textTransform: "lowercase",
                    color: isHot ? "#000000" : "#a3a3a3",
                    transition: reduceMotion ? "none" : "color 0.18s ease",
                  }}
                  onMouseEnter={() => onItemEnter(item.index)}
                  onMouseLeave={onItemLeave}
                  onFocus={() => {
                    setFocusedIndex(item.index);
                    setHoveredIndex(item.index);
                    if (!isDragging) {
                      setRotation((prev) =>
                        snapRotationForIndex(item.index, prev),
                      );
                    }
                  }}
                  onBlur={() => setHoveredIndex(null)}
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
