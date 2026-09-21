"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { INSTALLATION_SHOWS } from "@/data/installation";
import {
  INSTALL_CENTER_H,
  INSTALL_CENTER_W,
  INSTALL_META_GAP,
  INSTALL_META_W,
  installationCardSize,
  installationTitleFontSize,
} from "@/lib/installation-layout";
import {
  DESKTOP_LAYOUT_W,
  getDesktopSignatureZoneWidth,
  getDesktopStageMetrics,
} from "@/lib/desktop-stage";

import "./installation-gallery.css";

type Props = {
  visible: boolean;
  /** Fade neighbors / meta while the detail page takes the hero. */
  exiting?: boolean;
  /** Reverse handoff — neighbors / meta fade back in. */
  closing?: boolean;
  /** Open the detail page for a show (title click / double-activate). */
  onOpenShow?: (show: (typeof INSTALLATION_SHOWS)[number]) => void;
  /** Jump carousel to this show id when provided (e.g. after Back/Next stub). */
  focusShowId?: string | null;
};

/**
 * Photoshop mockup frames on 1167.5×1624.5 → layout.
 * Fixed frame boxes + uniform 14px gutters; images object-fit:contain
 * (native aspect, no crop). Three slots in view (center + near neighbors);
 * infinite scroll / click-to-jump still wraps the full show list.
 */
const CENTER_W = INSTALL_CENTER_W;
const CENTER_H = INSTALL_CENTER_H;
const NEAR_SCALE = 763.026 / 1163.095;
/** Used while mid-scroll when a neighbor briefly sits past ±1. */
const FAR_SCALE = 361.148 / 1163.095;
/** Mockup gutter between adjacent tiles (measured on grey placeholder art). */
const SLOT_GAP = 14;
const NEAR_H = CENTER_H * NEAR_SCALE;
/** Wheel / drag sensitivity — approximate one-slot travel. */
const NEAR_Y = CENTER_H / 2 + SLOT_GAP + NEAR_H / 2;
const N = INSTALLATION_SHOWS.length;
const SLOTS = [-1, 0, 1] as const;
const WHEEL_SETTLE_MS = 140;
const SNAP_MS = 520;
/** Ignore jitter so a click on a neighbor still centers it. */
const DRAG_THRESHOLD_PX = 10;
const META_W = INSTALL_META_W;
const META_GAP = INSTALL_META_GAP;

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

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function cardSizeForShow(
  show: (typeof INSTALLATION_SHOWS)[number],
  scale: number,
) {
  return installationCardSize(show, scale);
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

  const deltaOf = (slot: number) => slot - frac;
  const sizeOf = (slot: number) =>
    cardSizeForShow(
      INSTALLATION_SHOWS[wrapIndex(base + slot)]!,
      scaleForDistance(deltaOf(slot)),
    );

  /* Equal SLOT_GAP between card edges (not centers), even when aspects differ. */
  const h0 = sizeOf(0).h;
  const hPos = sizeOf(1).h;
  const hNeg = sizeOf(-1).h;
  const stepPos = h0 / 2 + SLOT_GAP + hPos / 2;
  const stepNeg = h0 / 2 + SLOT_GAP + hNeg / 2;
  const originShift = frac >= 0 ? -frac * stepPos : -frac * stepNeg;

  const yOf = (slot: number) => {
    if (slot === 0) return originShift;
    if (slot === 1) return originShift + stepPos;
    if (slot === -1) return originShift - stepNeg;
    return originShift + slot * ((stepPos + stepNeg) / 2);
  };

  return SLOTS.map((slot) => {
    const delta = deltaOf(slot);
    const showIndex = wrapIndex(base + slot);
    return {
      key: `${slot}:${showIndex}`,
      showIndex,
      slot,
      delta,
      y: yOf(slot),
      scale: scaleForDistance(delta),
      z: 30 - Math.abs(slot) * 5,
      active: Math.abs(delta) < 0.45,
    };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export function InstallationGallery({
  visible,
  exiting = false,
  closing = false,
  onOpenShow,
  focusShowId,
}: Props) {
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
  const lastTapRef = useRef<{ index: number; at: number } | null>(null);
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
      lastTapRef.current = null;
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

  useLayoutEffect(() => {
    if (!visible || !focusShowId) return;
    const i = INSTALLATION_SHOWS.findIndex((s) => s.id === focusShowId);
    if (i < 0) return;
    /* Handoff needs the active card already in the center slot. */
    if (closing || exiting) {
      window.cancelAnimationFrame(animRef.current);
      paint(i);
      return;
    }
    animateTo(i);
  }, [animateTo, closing, exiting, focusShowId, visible]);

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
  /** Active card pixel size — meta docks 28px off its right edge. */
  const activeCard = cardSizeForShow(active, 1);
  const blockW = activeCard.w + META_GAP + META_W;
  /** Equal padding between nav column and compact logo. */
  const blockLeft = column.left + Math.max(0, (column.width - blockW) / 2);
  const titleSize = installationTitleFontSize(active.titleLines, META_W);

  return (
    <div
      className="installation-gallery"
      data-visible={visible ? "" : undefined}
      data-exiting={exiting ? "" : undefined}
      data-closing={closing ? "" : undefined}
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
        style={{ left: blockLeft, width: activeCard.w }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="installation-gallery__stage">
          {poses.map((pose) => {
            const show = INSTALLATION_SHOWS[pose.showIndex]!;
            const { w, h } = cardSizeForShow(show, pose.scale);
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
                  if (!pose.active) {
                    jumpTo(pose.showIndex);
                    return;
                  }
                  /* Double-press / double-click on the centered image opens the page. */
                  const now = performance.now();
                  const last = lastTapRef.current;
                  if (
                    last &&
                    last.index === pose.showIndex &&
                    now - last.at < 420
                  ) {
                    lastTapRef.current = null;
                    onOpenShow?.(show);
                    return;
                  }
                  lastTapRef.current = { index: pose.showIndex, at: now };
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  if (!pose.active) return;
                  lastTapRef.current = null;
                  onOpenShow?.(show);
                }}
              >
                <Image
                  src={show.src}
                  alt={show.alt}
                  width={show.width}
                  height={show.height}
                  className="installation-gallery__image"
                  sizes="1280px"
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
        id="installation-gallery-meta"
        className="installation-gallery__meta"
        aria-live="polite"
        style={{
          left: blockLeft + activeCard.w + META_GAP,
          width: META_W,
        }}
      >
        <p className="installation-gallery__year">{active.year}</p>
        <p className="installation-gallery__kind">{active.kind}</p>
        <button
          type="button"
          className="installation-gallery__title"
          style={{ color: active.titleColor, fontSize: `${titleSize}px` }}
          onClick={() => onOpenShow?.(active)}
          aria-label={`Open ${active.titleLines.join(" ")}`}
        >
          {active.titleLines.map((line) => (
            <span key={line} className="installation-gallery__title-line">
              {line}
            </span>
          ))}
        </button>
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
