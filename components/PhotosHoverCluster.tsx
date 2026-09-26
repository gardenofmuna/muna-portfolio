"use client";

import Image from "next/image";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import { DESKTOP_LAYOUT_H, DESKTOP_LAYOUT_W } from "@/lib/desktop-stage";
import {
  NARROW_CENTER_POPUP_MAX,
  NARROW_PHOTOS_NUDGE_UP_PX,
  NARROW_PHOTOS_POPUP_SCALE,
} from "@/lib/narrow-stage";
import {
  SHOT_ON_FILM_START,
  SHOT_ON_FILM_STILLS,
} from "@/data/shot-on-film";

import "./photos-hover-cluster.css";

const REF_STAGE_W = 1440;
const REF_STAGE_H = 811.5;
const U_STAGE_FLUID = `min(100vw / ${REF_STAGE_W}, 100vh / ${REF_STAGE_H})`;

/** Overall cluster scale vs prior layout (~0.8 ≈ 20% smaller). */
const CLUSTER_SCALE = 0.8;
const FAN_OUT_EXTRA_REF_PX = 64;
const HOVER_FAN_MS = 420;

/** Lift & depth (stacked shadows read as seated prints). */
const SHADOW_BACK =
  "0 14px 32px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)";
const SHADOW_FRONT =
  "0 26px 50px rgba(0, 0, 0, 0.28), 0 12px 28px rgba(0, 0, 0, 0.16), 0 4px 8px rgba(0, 0, 0, 0.1)";

const SRC_W = 3600;
const SRC_H = 2387;

/** Longest box a still may occupy, then scaled down for neighbors. */
const REEL_MAX_W = 460;
const REEL_MAX_H = 500;
/** Clear air between frames — they do not stack flush. */
const REEL_GAP = 22;
const WHEEL_THRESHOLD = 24;
const WHEEL_QUIET_MS = 120;
const WHEEL_MIN_GAP_MS = 300;
const DRAG_THRESHOLD = 48;
const NEIGHBOR_SCALE = 0.88;

/** Each opening lands on the start still, inside the middle copy of the loop. */
function startIndex(n: number) {
  return n + SHOT_ON_FILM_START;
}

function fittedStill(width: number, height: number, scale = 1) {
  const fit = Math.min(REEL_MAX_W / width, REEL_MAX_H / height);
  return { w: width * fit * scale, h: height * fit * scale };
}

type Props = {
  visible: boolean;
  variant?: "desktop" | "narrow";
  /** Lock sizes to the 1440×811.5 desktop stage (no vw/vh). */
  stageLocked?: boolean;
};

/**
 * Desktop: Studio Motion–style vertical film reel (viewfinder corners).
 * Narrow: keep the three-print fan popup.
 * Memoized: the reel is ~200 images and stays mounted while hidden, so it
 * must not re-render on unrelated home state (CV menu, nav wheel).
 */
export const PhotosHoverCluster = memo(function PhotosHoverCluster({
  visible,
  variant = "desktop",
  stageLocked = false,
}: Props) {
  const n = SHOT_ON_FILM_STILLS.length;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fanOut, setFanOut] = useState(false);
  const [loopIndex, setLoopIndex] = useState(() => startIndex(n));
  const [motionOn, setMotionOn] = useState(true);
  const wheelGesture = useRef({
    sum: 0,
    locked: false,
    lastEvent: 0,
    lastStep: 0,
    lastAbs: 0,
  });
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    origin: number;
    stepped: boolean;
    captured: boolean;
  } | null>(null);
  const uStage = stageLocked
    ? Math.min(DESKTOP_LAYOUT_W / REF_STAGE_W, DESKTOP_LAYOUT_H / REF_STAGE_H)
    : null;
  const uStageCss = uStage != null ? String(uStage) : U_STAGE_FLUID;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const [wasVisible, setWasVisible] = useState(visible);
  if (wasVisible !== visible) {
    setWasVisible(visible);
    if (!visible) {
      setFanOut(false);
      setLoopIndex(startIndex(n));
      setMotionOn(false);
    }
  }

  const isNarrow = variant === "narrow";

  const step = useCallback((delta: number) => {
    if (n <= 1) return;
    setMotionOn(true);
    setLoopIndex((i) => i + delta);
  }, [n]);

  /* After a wrap, jump back into the middle copy without animating. */
  useEffect(() => {
    if (n <= 1) return;
    if (loopIndex >= n && loopIndex < n * 2) return;
    const id = window.setTimeout(() => {
      setMotionOn(false);
      setLoopIndex((i) => {
        let next = i;
        while (next < n) next += n;
        while (next >= n * 2) next -= n;
        return next;
      });
    }, reduceMotion ? 0 : 430);
    return () => window.clearTimeout(id);
  }, [loopIndex, n, reduceMotion]);

  /* Native wheel so preventDefault can stop the page from scrolling. */
  useEffect(() => {
    if (!visible || isNarrow) return;
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: globalThis.WheelEvent) => {
      const dominant =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      event.preventDefault();
      const g = wheelGesture.current;
      const now = performance.now();
      const abs = Math.abs(dominant);
      const quiet = now - g.lastEvent > WHEEL_QUIET_MS;
      /* Momentum decays; a delta that jumps back up is a fresh swipe. */
      const surge = abs > g.lastAbs * 1.4 + 2;
      g.lastEvent = now;
      g.lastAbs = abs;
      /* One still per gesture: ignore the tail of trackpad momentum. */
      if (g.locked) {
        if (now - g.lastStep < WHEEL_MIN_GAP_MS) return;
        if (!quiet && !surge) return;
        g.locked = false;
        g.sum = 0;
      }
      if (quiet) g.sum = 0;
      g.sum += dominant;
      if (Math.abs(g.sum) < WHEEL_THRESHOLD) return;
      const dir = g.sum > 0 ? 1 : -1;
      g.sum = 0;
      g.locked = true;
      g.lastStep = now;
      step(dir);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [visible, isNarrow, reduceMotion, step]);

  const onReelPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      origin: loopIndex,
      stepped: false,
      captured: false,
    };
  };

  const onReelPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dy = event.clientY - drag.startY;
    /* Capture only once it's a drag, so a plain click still reaches the
       neighbouring frame's button. */
    if (!drag.captured && Math.abs(dy) > 6) {
      drag.captured = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (Math.abs(dy) < DRAG_THRESHOLD) return;
    drag.startY = event.clientY;
    drag.stepped = true;
    step(dy < 0 ? 1 : -1);
  };

  const onReelPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  };

  const fadeMs = reduceMotion ? 80 : 520;
  const clusterScale = isNarrow ? NARROW_PHOTOS_POPUP_SCALE : CLUSTER_SCALE;
  const cardWRef = Math.round(300 * clusterScale);
  const clusterWRef = Math.round(860 * clusterScale);
  const clusterHRef = Math.round(300 * 2.2 * clusterScale);
  const fanOffsetRef = Math.round(cardWRef * 0.46);

  const imgW = isNarrow
    ? `${cardWRef}px`
    : uStage != null
      ? `${cardWRef * uStage}px`
      : `calc(${cardWRef} * ${uStageCss})`;
  const dim = (nRef: number) =>
    isNarrow
      ? `${nRef}px`
      : uStage != null
        ? `${nRef * uStage}px`
        : `calc(${nRef} * ${uStageCss})`;

  const fanX = isNarrow
    ? `${fanOffsetRef}px`
    : uStage != null
      ? `${fanOffsetRef * uStage}px`
      : `calc(${fanOffsetRef} * ${uStageCss})`;
  const spreadX = !fanOut
    ? "0px"
    : isNarrow
      ? `${FAN_OUT_EXTRA_REF_PX}px`
      : uStage != null
        ? `${FAN_OUT_EXTRA_REF_PX * uStage}px`
        : `calc(${FAN_OUT_EXTRA_REF_PX} * ${uStageCss})`;

  const photo = (src: string, alt: string, sizes: string) => (
    <Image
      src={src}
      alt={alt}
      width={SRC_W}
      height={SRC_H}
      draggable={false}
      sizes={sizes}
      className="pointer-events-none block h-auto max-w-none select-none"
      style={{ width: imgW, height: "auto" }}
    />
  );

  const clusterInner = (
    <div
      className={`photos-cluster relative ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
      style={
        {
          width: dim(clusterWRef),
          height: dim(clusterHRef),
          maxWidth: isNarrow
            ? NARROW_CENTER_POPUP_MAX
            : stageLocked
              ? DESKTOP_LAYOUT_W
              : "92vw",
          "--photos-fan-x": fanX,
          "--photos-spread-x": spreadX,
          "--photos-wing-ms": reduceMotion ? "0ms" : `${HOVER_FAN_MS}ms`,
        } as CSSProperties
      }
      onMouseEnter={() => setFanOut(true)}
      onMouseLeave={() => setFanOut(false)}
    >
      <div
        className="photos-cluster__wing photos-cluster__wing--left z-[1]"
        style={{
          boxShadow: SHADOW_BACK,
          transform:
            "translateX(calc(-50% - var(--photos-fan-x) - var(--photos-spread-x))) rotate(-17deg)",
        }}
      >
        {photo(
          "/Muna3-09.jpg",
          "Architectural photo",
          "(max-width: 768px) 36vw, 300px",
        )}
      </div>
      <div
        className="photos-cluster__wing photos-cluster__wing--right z-[2]"
        style={{
          boxShadow: SHADOW_BACK,
          transform:
            "translateX(calc(-50% + var(--photos-fan-x) + var(--photos-spread-x))) rotate(17deg)",
        }}
      >
        {photo(
          "/Muna3-04.jpg",
          "Portrait photo",
          "(max-width: 768px) 36vw, 300px",
        )}
      </div>
      <div
        className="photos-cluster__wing photos-cluster__wing--front z-[3]"
        style={{
          marginBottom: isNarrow
            ? `${Math.round(12 * clusterScale)}px`
            : uStage != null
              ? `${Math.round(12 * clusterScale) * uStage}px`
              : `calc(${Math.round(12 * clusterScale)} * ${uStageCss})`,
          boxShadow: SHADOW_FRONT,
          transform: "translateX(-50%)",
        }}
      >
        {photo(
          "/Muna3-25.jpg",
          "Production doorway scene",
          "(max-width: 768px) 40vw, 320px",
        )}
      </div>
    </div>
  );

  const fadeStyle = {
    opacity: visible ? 1 : 0,
    transition: reduceMotion
      ? "none"
      : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.56, 1)`,
    transform: visible
      ? isNarrow
        ? `translateY(-${NARROW_PHOTOS_NUDGE_UP_PX}px)`
        : "translateY(0)"
      : isNarrow
        ? `translateY(${12 - NARROW_PHOTOS_NUDGE_UP_PX}px)`
        : "translateY(12px)",
  } as const;

  if (isNarrow) {
    return (
      <NarrowCenterPopup visible={visible} style={fadeStyle}>
        <div aria-label="Photos preview">{clusterInner}</div>
      </NarrowCenterPopup>
    );
  }

  return (
    <div
      className={
        stageLocked
          ? "photos-reel pointer-events-none absolute inset-0 z-[40] select-none"
          : "photos-reel pointer-events-none fixed inset-0 z-[40] select-none"
      }
      aria-hidden={!visible}
      style={fadeStyle}
    >
      <div className="photos-reel__stage">
        <div
          ref={stageRef}
          className={`photos-reel__viewport ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
          role="region"
          aria-roledescription="carousel"
          aria-label="Shot on film"
          tabIndex={visible ? 0 : -1}
          onPointerDown={onReelPointerDown}
          onPointerMove={onReelPointerMove}
          onPointerUp={onReelPointerUp}
          onPointerCancel={onReelPointerUp}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowRight") {
              event.preventDefault();
              step(1);
            } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
              event.preventDefault();
              step(-1);
            }
          }}
        >
          {(() => {
            const activeSlot = loopIndex % n;
            const copies = [0, 1, 2].flatMap((copy) =>
              SHOT_ON_FILM_STILLS.map((still, i) => ({
                still,
                slot: i,
                key: `${copy}-${still.src}`,
                active: copy * n + i === loopIndex,
              })),
            );
            const heights = copies.map((item) => {
              const box = fittedStill(item.still.width, item.still.height);
              return box.h * (item.active ? 1 : NEIGHBOR_SCALE);
            });
            const tops: number[] = [];
            let cursor = 0;
            for (const h of heights) {
              tops.push(cursor);
              cursor += h + REEL_GAP;
            }
            const activeTop = tops[loopIndex] ?? 0;
            const activeH = heights[loopIndex] ?? 0;
            const activeCenter = activeTop + activeH / 2;
            const activeStill = SHOT_ON_FILM_STILLS[activeSlot]!;
            const activeBox = fittedStill(activeStill.width, activeStill.height);
            return (
              <>
                <div
                  className="photos-reel__track"
                  style={{
                    transform: `translateY(${-activeCenter}px)`,
                    transition:
                      !motionOn || reduceMotion
                        ? "none"
                        : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {copies.map((item, i) => {
                    const box = fittedStill(item.still.width, item.still.height);
                    const h = heights[i]!;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className="photos-reel__frame"
                        data-active={item.active ? "" : undefined}
                        data-orient={
                          item.still.height > item.still.width
                            ? "portrait"
                            : "landscape"
                        }
                        tabIndex={-1}
                        aria-label={item.still.alt}
                        aria-current={item.active ? "true" : undefined}
                        onClick={() => {
                          if (item.active) return;
                          step(i < loopIndex ? -1 : 1);
                        }}
                        style={{
                          width: box.w,
                          height: h,
                          top: tops[i],
                        }}
                      >
                        <Image
                          src={item.still.src}
                          alt=""
                          width={item.still.width}
                          height={item.still.height}
                          draggable={false}
                          sizes="460px"
                          className="photos-reel__image"
                          unoptimized
                          priority={item.slot === activeSlot && i >= n && i < n * 2}
                          quality={85}
                        />
                      </button>
                    );
                  })}
                </div>
                <div
                  className="photos-reel__finder"
                  data-orient={
                    activeBox.h > activeBox.w ? "portrait" : "landscape"
                  }
                  aria-hidden
                  style={{
                    width: activeBox.w + 16,
                    height: activeBox.h + 16,
                    transition: reduceMotion
                      ? "none"
                      : "width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <span className="photos-reel__corner photos-reel__corner--tl" />
                  <span className="photos-reel__corner photos-reel__corner--tr" />
                  <span className="photos-reel__corner photos-reel__corner--bl" />
                  <span className="photos-reel__corner photos-reel__corner--br" />
                  <p
                    key={`${activeStill.place}-${activeStill.taken}`}
                    className="photos-reel__caption"
                  >
                    <span>{activeStill.place}</span>
                    <span>{activeStill.taken}</span>
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
});
