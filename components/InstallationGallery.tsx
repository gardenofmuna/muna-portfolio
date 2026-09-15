"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { INSTALLATION_SHOWS } from "@/data/installation";
import {
  DESKTOP_LAYOUT_W,
  getDesktopSignatureZoneWidth,
  getDesktopStageMetrics,
} from "@/lib/desktop-stage";

import "./installation-gallery.css";

type Props = {
  visible: boolean;
};

/**
 * Photoshop mockup frames on 1167.5×1624.5 → layout.
 * Fixed frame boxes + uniform 14px gutters; images object-fit:contain
 * (native aspect, no crop). Three slots in view (center + near neighbors);
 * infinite scroll / click-to-jump still wraps the full show list.
 */
const PS = 811.5 / 1624.5;
const CENTER_W = 1163.095 * PS;
const CENTER_H = 621 * PS;
const NEAR_SCALE = 763.026 / 1163.095;
/** Used while mid-scroll when a neighbor briefly sits past ±1. */
const FAR_SCALE = 361.148 / 1163.095;
/** Mockup gutter between adjacent tiles (measured on grey placeholder art). */
const SLOT_GAP = 14;
const NEAR_H = CENTER_H * NEAR_SCALE;
const FAR_H = CENTER_H * FAR_SCALE;
const NEAR_Y = CENTER_H / 2 + SLOT_GAP + NEAR_H / 2;
const FAR_Y = NEAR_Y + NEAR_H / 2 + SLOT_GAP + FAR_H / 2;
const N = INSTALLATION_SHOWS.length;
const SLOTS = [-1, 0, 1] as const;
const WHEEL_SETTLE_MS = 140;
const SNAP_MS = 520;
/** Ignore jitter so a click on a neighbor still centers it. */
const DRAG_THRESHOLD_PX = 10;
const META_W = 260;
const META_GAP = 28;
const TITLE_BASE_PX = 36;
/** Arial advance ≈ 0.56em before letter-spacing. */
const TITLE_CHAR_EM = 0.56;
const TITLE_TRACKING_EM = -0.04;

function wrapIndex(i: number) {
  return ((i % N) + N) % N;
}

function wrapDelta(delta: number) {
  let d = delta;
  while (d > N / 2) d -= N;
  while (d < -N / 2) d += N;
  return d;
}

function scaleForDistance(dist: number) {
  const d = Math.abs(dist);
  if (d <= 1) return 1 + (NEAR_SCALE - 1) * d;
  if (d <= 2) return NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * (d - 1);
  return FAR_SCALE * Math.max(0, 1 - (d - 2));
}

function offsetY(delta: number) {
  const ad = Math.abs(delta);
  const sign = Math.sign(delta) || 1;
  if (ad <= 1) return delta * NEAR_Y;
  if (ad <= 2) {
    const t = ad - 1;
    return sign * (NEAR_Y + t * (FAR_Y - NEAR_Y));
  }
  return sign * FAR_Y * (ad / 2);
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function titleFontSize(lines: readonly string[], metaWidth: number) {
  const longest = Math.max(...lines.map((line) => line.length), 1);
  // width ≈ size * (charEm * n + tracking * (n − 1)); keep each line one row.
  const widthEm =
    longest * TITLE_CHAR_EM + Math.max(0, longest - 1) * TITLE_TRACKING_EM;
  return Math.max(22, Math.min(TITLE_BASE_PX, metaWidth / widthEm));
}

/**
 * Content column between the open nav and the compact “m” logo.
 * Gallery+meta centers here so left/right padding stay equal.
 */
function contentColumn() {
  const m = getDesktopStageMetrics();
  const signatureZone = getDesktopSignatureZoneWidth(true);
  const left = m.navZoneOpen;
  const width = Math.max(
    1,
    DESKTOP_LAYOUT_W - m.navZoneOpen - signatureZone,
  );
  return { left, width };
}

type CardPose = {
  key: string;
  showIndex: number;
  slot: number;
  delta: number;
  y: number;
  scale: number;
  z: number;
  active: boolean;
};

function posesAt(progress: number): CardPose[] {
  const base = Math.round(progress);
  const frac = progress - base;
  return SLOTS.map((slot) => {
    const delta = slot - frac;
    const showIndex = wrapIndex(base + slot);
    return {
      key: `${slot}:${showIndex}`,
      showIndex,
      slot,
      delta,
      y: offsetY(delta),
      scale: scaleForDistance(delta),
      z: 30 - Math.abs(slot) * 5,
      active: Math.abs(delta) < 0.45,
    };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export function InstallationGallery({ visible }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const settleTimerRef = useRef(0);
  const animRef = useRef(0);
  const dragRef = useRef<{
    y: number;
    progress: number;
    pointerId: number;
    dragging: boolean;
  } | null>(null);
  /** After a real drag, suppress the synthetic click on the card underneath. */
  const suppressClickRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
    if (!visible) {
      window.cancelAnimationFrame(animRef.current);
      window.clearTimeout(settleTimerRef.current);
      dragRef.current = null;
      suppressClickRef.current = false;
      progressRef.current = 0;
      setProgress(0);
    }
  }, [visible]);

  const paint = useEffectEvent((next: number) => {
    progressRef.current = next;
    setProgress(next);
  });

  const animateTo = useCallback(
    (target: number) => {
      window.cancelAnimationFrame(animRef.current);
      if (reduceMotion) {
        paint(target);
        return;
      }
      const from = progressRef.current;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / SNAP_MS);
        paint(from + (target - from) * easeOutCubic(t));
        if (t < 1) animRef.current = window.requestAnimationFrame(tick);
      };
      animRef.current = window.requestAnimationFrame(tick);
    },
    [reduceMotion],
  );

  const snapNearest = useCallback(() => {
    animateTo(Math.round(progressRef.current));
  }, [animateTo]);

  const onWheel = useEffectEvent((event: WheelEvent) => {
    if (!visible) return;
    event.preventDefault();
    window.cancelAnimationFrame(animRef.current);
    const next = progressRef.current + event.deltaY / NEAR_Y;
    paint(next);
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(snapNearest, WHEEL_SETTLE_MS);
  });

  useEffect(() => {
    const el = stripRef.current;
    if (!el || !visible) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [visible]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!visible || event.button !== 0) return;
    window.cancelAnimationFrame(animRef.current);
    window.clearTimeout(settleTimerRef.current);
    dragRef.current = {
      y: event.clientY,
      progress: progressRef.current,
      pointerId: event.pointerId,
      dragging: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dy = event.clientY - drag.y;
    if (!drag.dragging) {
      if (Math.abs(dy) < DRAG_THRESHOLD_PX) return;
      drag.dragging = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* capture unsupported */
      }
    }
    paint(drag.progress - dy / NEAR_Y);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (drag.dragging) {
      suppressClickRef.current = true;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      snapNearest();
    }
  };

  const jumpTo = (index: number) => {
    const current = progressRef.current;
    const currentIndex = wrapIndex(Math.round(current));
    animateTo(current + wrapDelta(index - currentIndex));
  };

  const active = INSTALLATION_SHOWS[wrapIndex(Math.round(progress))]!;
  const poses = posesAt(progress);
  const fadeMs = reduceMotion ? 80 : 520;
  const column = contentColumn();
  const blockW = CENTER_W + META_GAP + META_W;
  /** Equal padding between nav column and compact logo. */
  const blockLeft = column.left + Math.max(0, (column.width - blockW) / 2);
  const titleSize = titleFontSize(active.titleLines, META_W);

  return (
    <div
      className="installation-gallery"
      data-visible={visible ? "" : undefined}
      aria-hidden={!visible}
      style={{
        transition: reduceMotion
          ? "none"
          : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <div
        ref={stripRef}
        className="installation-gallery__strip"
        tabIndex={visible ? 0 : -1}
        role="listbox"
        aria-label="Installation works"
        aria-activedescendant={`installation-card-${active.id}`}
        style={{ left: blockLeft, width: CENTER_W }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="installation-gallery__stage">
          {poses.map((pose) => {
            const show = INSTALLATION_SHOWS[pose.showIndex]!;
            const w = CENTER_W * pose.scale;
            const h = CENTER_H * pose.scale;
            const style: CSSProperties = {
              width: w,
              height: h,
              zIndex: pose.z,
              transform: `translate(-50%, calc(-50% + ${pose.y}px))`,
            };
            return (
              <button
                key={pose.key}
                id={
                  pose.active ? `installation-card-${show.id}` : undefined
                }
                type="button"
                role="option"
                aria-selected={pose.active}
                className="installation-gallery__card"
                data-active={pose.active ? "" : undefined}
                data-slot={pose.slot}
                tabIndex={-1}
                style={style}
                onClick={(event) => {
                  event.stopPropagation();
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  if (!pose.active) jumpTo(pose.showIndex);
                }}
              >
                <Image
                  src={show.src}
                  alt={show.alt}
                  width={show.width}
                  height={show.height}
                  className="installation-gallery__image"
                  sizes={`${Math.round(w * 2)}px`}
                  priority={pose.active}
                  draggable={false}
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="installation-gallery__meta"
        aria-live="polite"
        style={{
          left: blockLeft + CENTER_W + META_GAP,
          width: META_W,
        }}
      >
        <p className="installation-gallery__year">{active.year}</p>
        <p className="installation-gallery__kind">{active.kind}</p>
        <p
          className="installation-gallery__title"
          style={{ color: active.titleColor, fontSize: `${titleSize}px` }}
        >
          {active.titleLines.map((line) => (
            <span key={line} className="installation-gallery__title-line">
              {line}
            </span>
          ))}
        </p>
        <p className="installation-gallery__venue">
          {active.venueLines.map((line) => (
            <span key={line} className="installation-gallery__venue-line">
              {line}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
