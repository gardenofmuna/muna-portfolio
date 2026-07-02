"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, Fragment } from "react";

import {
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
import {
  NARROW_H,
  NARROW_LABEL_ACTIVE,
  NARROW_LABEL_INACTIVE,
  NARROW_LABEL_TRACKING_EM,
  NARROW_W,
  NARROW_WHEEL_CENTER,
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
/** Narrow touch spin — friction per frame (~60fps) */
const SPIN_FRICTION = 0.9;
const SPIN_STOP_VEL = 0.0015;
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
};

export function CircularNavWheel({
  onActiveLabelChange,
  onHoverLabelChange,
  onWheelInteractingChange,
  initialActiveLabel,
  layout = "desktop",
}: CircularNavWheelProps = {}) {
  const isNarrow = layout === "narrow";
  const ringLayout = useNarrowRingLayout(isNarrow);
  const labelAngles = ringLayout.labelAngles;
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
  const labelAnglesRef = useRef(labelAngles);
  labelAnglesRef.current = labelAngles;
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
    lastAngle: 0,
    cumMovePx: 0,
    moved: false,
    lastMoveTs: 0,
    velocity: 0,
  });
  const spinRafRef = useRef(0);

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
  const r = isNarrow ? ringLayout.radius : Math.min(w, h) * 0.88;

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
        return narrowLabelAngle(i, labelAngles);
      }
      return -Math.PI / 2 + (2 * Math.PI * i) / N;
    },
    [N, labelAngles, isNarrow],
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

  const snapNarrowToIndex = useCallback(
    (index: number, current = rotationRef.current) => {
      let next = snapRotationForIndex(index, current);
      setIsSnapping(true);
      setRotation(next);
      rotationRef.current = next;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const delta = narrowVisualSnapDelta(index, wrapRef.current);
          if (Math.abs(delta) >= 0.0004) {
            next += delta;
            setRotation(next);
            rotationRef.current = next;
          }
          window.setTimeout(() => setIsSnapping(false), NARROW_SNAP_MS);
        });
      });
    },
    [snapRotationForIndex],
  );

  const stopSpin = useCallback(() => {
    if (spinRafRef.current) {
      cancelAnimationFrame(spinRafRef.current);
      spinRafRef.current = 0;
    }
  }, []);

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
    stopSpin();
    const φ = rotationRef.current;
    const bestI = narrowIndexAtTop(φ, labelAnglesRef.current);
    selectNarrowIndex(bestI, φ);
    setWheelInteracting(false);
  }, [selectNarrowIndex, setWheelInteracting, stopSpin]);

  const runSpinMomentum = useCallback(() => {
    stopSpin();
    const step = () => {
      const v = dragRef.current.velocity;
      if (Math.abs(v) < SPIN_STOP_VEL) {
        spinRafRef.current = 0;
        finishNarrowSpin();
        return;
      }
      setRotation((prev) => {
        const next = prev + v;
        rotationRef.current = next;
        if (isNarrowRef.current) {
          syncNarrowTopHover(next);
        }
        return next;
      });
      dragRef.current.velocity *= SPIN_FRICTION;
      spinRafRef.current = requestAnimationFrame(step);
    };
    spinRafRef.current = requestAnimationFrame(step);
  }, [finishNarrowSpin, stopSpin, syncNarrowTopHover]);

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
          const bestI = narrowIndexAtTop(φ, labelAnglesRef.current);
          setFocusedIndex(bestI);
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

  useLayoutEffect(() => {
    if (!isNarrow || isDraggingRef.current || !ringLayout.ready) return;
    if (spinRafRef.current) return;
    snapNarrowToIndex(focusedRef.current, rotationRef.current);
  }, [isNarrow, snapNarrowToIndex, labelAngles, ringLayout.ready]);

  useEffect(
    () => () => {
      stopSpin();
      setWheelInteracting(false);
    },
    [setWheelInteracting, stopSpin],
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
    setFocusedIndex(i);
    if (!isDragging && !isNarrow) {
      setRotation((prev) => snapRotationForIndex(i, prev));
    }
  };

  const onItemLeave = () => setHoveredIndex(null);

  const pointerLocal = (clientX: number, clientY: number) => {
    if (!isNarrow) return { x: clientX, y: clientY };
    const el = wrapRef.current;
    if (!el) return { x: clientX, y: clientY };
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return { x: clientX, y: clientY };
    }
    return {
      x: ((clientX - rect.left) / rect.width) * NARROW_W,
      y: ((clientY - rect.top) / rect.height) * NARROW_H,
    };
  };

  const onPointerDownCapture = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = wrapRef.current;
    if (!el) return;
    stopSpin();
    setIsSnapping(false);
    setWheelInteracting(true);
    const p = pointerLocal(e.clientX, e.clientY);
    const now = performance.now();
    dragRef.current = {
      pointerId: e.pointerId,
      lastAngle: Math.atan2(p.y - originY, p.x - originX),
      cumMovePx: 0,
      moved: false,
      lastMoveTs: now,
      velocity: 0,
    };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return;

    const p = pointerLocal(e.clientX, e.clientY);
    const angle = Math.atan2(p.y - originY, p.x - originX);
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

    const now = performance.now();
    const dt = now - dragRef.current.lastMoveTs;
    if (dt > 0) {
      dragRef.current.velocity = (delta / dt) * 16;
    }
    dragRef.current.lastMoveTs = now;

    setRotation((prev) => {
      const next = prev + delta;
      rotationRef.current = next;
      if (isNarrow) {
        syncNarrowTopHover(next);
      }
      return next;
    });
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

    const φ = rotationRef.current;

    if (!wasMoved) {
      const p = pointerLocal(e.clientX, e.clientY);
      if (isNarrow) {
        const i = nearestIndexToPointer(p.x, p.y, φ);
        selectNarrowIndex(i, φ);
        setWheelInteracting(false);
      } else {
        const i = nearestIndexToPointer(p.x, p.y, φ);
        setFocusedIndex(i);
        setRotation((prev) => snapRotationForIndex(i, prev));
      }
    } else if (isNarrow) {
      if (Math.abs(dragRef.current.velocity) > SPIN_STOP_VEL * 2) {
        runSpinMomentum();
      } else {
        finishNarrowSpin();
      }
    } else {
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

  const narrowRingPath = narrowRingPathD(r);

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
              opacity: ringLayout.ready ? 1 : 0,
              transition:
                isDragging || reduceMotion
                  ? "none"
                  : isSnapping
                    ? `transform ${NARROW_SNAP_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s ease`
                    : "opacity 0.15s ease",
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
                  const isHot =
                    hoveredIndex === i ||
                    (hoveredIndex === null && focusedIndex === i);
                  return (
                    <Fragment key={label}>
                      <tspan
                        id={`circular-nav-item-${i}`}
                        fill={isHot ? NARROW_LABEL_ACTIVE : NARROW_LABEL_INACTIVE}
                        fontWeight={800}
                        style={{
                          transition: reduceMotion ? "none" : "fill 0.18s ease",
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
