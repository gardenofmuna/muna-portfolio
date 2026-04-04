"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const DRAG_MOVE_RAD = 0.04;
const TAP_MOVE_PX = 14;
/** Wheel / trackpad → radians per delta unit */
const WHEEL_ROT_SCALE = 0.0022;
/** Idle after wheel before snapping to nearest slot */
const WHEEL_SNAP_MS = 140;

export type CircularNavWheelProps = {
  onActiveLabelChange?: (label: string) => void;
  /** Section selected on first paint (wheel angle + focus). Default: first label (`about`). */
  initialActiveLabel?: (typeof LABELS)[number];
};

export function CircularNavWheel({
  onActiveLabelChange,
  initialActiveLabel,
}: CircularNavWheelProps = {}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
  const onLabelRef = useRef(onActiveLabelChange);
  onLabelRef.current = onActiveLabelChange;

  const dragRef = useRef({
    pointerId: -1,
    lastAngle: 0,
    cumMovePx: 0,
    moved: false,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
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
  }, []);

  const { w, h } = size;
  const originX = -0.22 * w - ARC_OFFSET_BACK_PX;
  const originY = h / 2;
  const r = Math.min(w, h) * 0.88;

  /* Evenly fill 360° with ~TARGET_ARC_SPACING_PX between neighbours: Δθ ≈ s/r, N ≈ 2πr/s */
  const repeats = Math.max(
    1,
    Math.round(
      (2 * Math.PI * r) /
        (TARGET_ARC_SPACING_PX * LABELS.length)
    )
  );
  const items = useMemo(() => buildItems(repeats), [repeats]);
  const N = items.length;

  const baseAngle = useCallback(
    (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / N,
    [N]
  );

  const snapRotationForIndex = useCallback(
    (i: number, current: number) => {
      const θ = baseAngle(i);
      return snapRotationForIndexContinuous(θ, current, w / 2, originX, r);
    },
    [baseAngle, originX, r, w]
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
    setRotation((prev) =>
      snapRotationForIndex(focusedRef.current, prev)
    );
  }, [w, h, snapRotationForIndex]);

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
      setFocusedIndex(next);
      setHoveredIndex(null);
      setRotation((prev) => snapRotationForIndex(next, prev));
      queueMicrotask(() => {
        document
          .getElementById(`circular-nav-item-${next}`)
          ?.focus({ preventScroll: true });
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [N, snapRotationForIndex]);

  const onItemEnter = (i: number) => {
    setHoveredIndex(i);
    setFocusedIndex(i);
    if (!isDragging) {
      setRotation((prev) => snapRotationForIndex(i, prev));
    }
  };

  const onItemLeave = () => setHoveredIndex(null);

  const onPointerDownCapture = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = wrapRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: e.pointerId,
      lastAngle: Math.atan2(e.clientY - originY, e.clientX - originX),
      cumMovePx: 0,
      moved: false,
    };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current.cumMovePx += Math.hypot(e.movementX, e.movementY);

    const angle = Math.atan2(e.clientY - originY, e.clientX - originX);
    let delta = angle - dragRef.current.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    dragRef.current.lastAngle = angle;

    if (
      dragRef.current.cumMovePx > TAP_MOVE_PX ||
      Math.abs(delta) > DRAG_MOVE_RAD
    ) {
      dragRef.current.moved = true;
    }

    if (dragRef.current.moved) {
      setRotation((prev) => prev + delta);
    }
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
      const i = nearestIndexToPointer(e.clientX, e.clientY, φ);
      setFocusedIndex(i);
      setRotation((prev) => snapRotationForIndex(i, prev));
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

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 touch-none bg-white select-none"
      style={{ zIndex: 1 }}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
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
          /* Straight type aligned with the radial (center → label); like sun rays, not tangent / ribbon */
          const rotDeg = layoutRound((θ * 180) / Math.PI);

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
                  transform: `rotate(${rotDeg}deg)`,
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
                      snapRotationForIndex(item.index, prev)
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
    </div>
  );
}
