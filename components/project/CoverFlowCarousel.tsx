"use client";

import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export type CoverFlowItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Multiplier applied on top of distance-based scale (e.g. bandana padding). */
  scale?: number;
  objectPosition?: string;
  label?: string;
};

export type CoverFlowVariant = "poster" | "merchandise";

type CoverFlowCarouselProps = {
  items: CoverFlowItem[];
  ariaLabel: string;
  itemNoun: string;
  initialIndex?: number;
  variant?: CoverFlowVariant;
  /** Pixel offset between adjacent cards — controlled by parent layout state. */
  sideOffset?: number;
  /** Scale for immediate neighbors (offset ±1). */
  neighbor1Scale?: number;
  /** Scale for second neighbors (offset ±2). */
  neighbor2Scale?: number;
  maxRotation?: number;
};

const POSTER_SLOT_OFFSETS = [-1, 0, 1] as const;

const FAN_BEHAVIOR = {
  /** 2D fan — prev / current / next only, even ±4° steps. */
  sideOffset: 90,
  neighbor1Scale: 0.84,
  neighbor2Scale: 0.8,
  maxRotation: 8,
  maxVisibleOffset: 1,
  tilt: "fan" as const,
  centerScale: 1.05,
  outerOpacity: 0.85,
} as const;

const DEFAULT_VARIANT_BEHAVIOR = {
  poster: {
    ...FAN_BEHAVIOR,
    sideOffset: 104,
  },
  merchandise: {
    ...FAN_BEHAVIOR,
    sideOffset: 104,
  },
} as const;

const SWIPE_OFFSET_PX = 52;
const SWIPE_VELOCITY = 320;
const POSTER_SCROLL_STEP = 52;
const POSTER_SCROLL_COOLDOWN_MS = 120;
/** Only hijack page scroll while the section title is near the hamburger. */
const PIN_SLACK_PX = 10;
const PIN_PAST_PX = 36;

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(length - 1, index));
}

function wrapIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

function scaleForOffset(
  abs: number,
  neighbor1Scale: number,
  neighbor2Scale: number,
  centerScale: number,
) {
  if (abs === 0) return centerScale;
  if (abs === 1) return neighbor1Scale;
  if (abs === 2) return neighbor2Scale;
  return neighbor2Scale * 0.82;
}

function itemTransform(
  offset: number,
  sideOffset: number,
  neighbor1Scale: number,
  neighbor2Scale: number,
  maxRotation: number,
  maxVisibleOffset: number,
  tilt: "fan" | "stack",
  itemScale = 1,
  centerScale = 1,
  outerOpacity = 1,
) {
  const abs = Math.abs(offset);
  if (abs > maxVisibleOffset) {
    return {
      x: offset * sideOffset * 0.3,
      scale: 0.5 * itemScale,
      rotate: 0,
      zIndex: 0,
      opacity: 0,
    };
  }

  const scale =
    scaleForOffset(abs, neighbor1Scale, neighbor2Scale, centerScale) *
    itemScale;
  const rotate =
    tilt === "fan" ? offset * (maxRotation / 2) : offset * maxRotation;

  return {
    x: offset * sideOffset,
    scale,
    rotate,
    zIndex: 100 - abs,
    opacity: abs === maxVisibleOffset ? outerOpacity : 1,
  };
}

export function CoverFlowCarousel({
  items,
  ariaLabel,
  itemNoun,
  initialIndex = 0,
  variant = "poster",
  sideOffset,
  neighbor1Scale,
  neighbor2Scale,
  maxRotation,
}: CoverFlowCarouselProps) {
  const reduceMotion = useReducedMotion();
  const regionId = useId();
  const statusId = `${regionId}-status`;
  const rootRef = useRef<HTMLElement>(null);
  const wrapSlots = true;
  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(initialIndex, items.length),
  );
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const dragX = useMotionValue(0);

  const goTo = useCallback(
    (index: number) => {
      if (items.length === 0) return;
      const next = clampIndex(index, items.length);
      activeIndexRef.current = next;
      setActiveIndex(next);
    },
    [items.length],
  );

  const stepWrap = useCallback(
    (delta: number) => {
      if (items.length === 0) return;
      const next = wrapIndex(activeIndexRef.current + delta, items.length);
      activeIndexRef.current = next;
      setActiveIndex(next);
    },
    [items.length],
  );

  const goPrevious = useCallback(() => {
    stepWrap(-1);
  }, [stepWrap]);

  const goNext = useCallback(() => {
    stepWrap(1);
  }, [stepWrap]);

  const finishDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      let next = activeIndex;

      if (
        info.offset.x <= -SWIPE_OFFSET_PX ||
        info.velocity.x <= -SWIPE_VELOCITY
      ) {
        next = activeIndex + 1;
      } else if (
        info.offset.x >= SWIPE_OFFSET_PX ||
        info.velocity.x >= SWIPE_VELOCITY
      ) {
        next = activeIndex - 1;
      }

      goTo(next);
      animate(dragX, 0, {
        duration: reduceMotion ? 0 : 0.22,
        ease: "easeOut",
      });
    },
    [activeIndex, dragX, goTo, reduceMotion],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    },
    [goNext, goPrevious],
  );

  useEffect(() => {
    if (reduceMotion) dragX.set(0);
  }, [activeIndex, dragX, reduceMotion]);

  useEffect(() => {
    if (items.length <= 1) return;
    const root = rootRef.current;
    if (!root) return;
    const scroller = root.closest(".project-pane__scroll");
    if (!(scroller instanceof HTMLElement)) return;
    const sectionId = variant === "poster" ? "posters" : "merchandise";
    const lockEl =
      (root.closest(`#${sectionId}`) as HTMLElement | null) ?? root;
    const heading =
      (lockEl.querySelector(".project-section__title") as HTMLElement | null) ??
      lockEl;
    const lastIndex = items.length - 1;

    let pinned = false;
    let releaseDir: "down" | "up" | null = null;
    let accumulated = 0;
    let cooldownUntil = 0;
    let holding = false;
    let lastTouchY = 0;

    const metrics = () => {
      const scrollerRect = scroller.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const sectionRect = lockEl.getBoundingClientRect();
      const toggle = document.querySelector(
        ".desktop-site-shell__menu-toggle",
      );
      const hamburgerTop =
        toggle instanceof HTMLElement
          ? toggle.getBoundingClientRect().top
          : scrollerRect.top + 36;
      return {
        scrollerRect,
        headingRect,
        sectionRect,
        desiredTop: hamburgerTop,
        drift: headingRect.top - hamburgerTop,
      };
    };

    const sectionReachedPin = () => {
      const { drift, sectionRect, scrollerRect } = metrics();
      return (
        drift <= PIN_SLACK_PX &&
        drift >= -PIN_PAST_PX &&
        sectionRect.bottom > scrollerRect.top + 80
      );
    };

    const sectionLeftView = () => {
      const { sectionRect, scrollerRect } = metrics();
      return (
        sectionRect.bottom < scrollerRect.top + 8 ||
        sectionRect.top > scrollerRect.bottom - 8
      );
    };

    const menuIsOpen = () =>
      !document.querySelector(".desktop-site-shell__menu-toggle");

    const holdPin = () => {
      if (menuIsOpen()) {
        pinned = false;
        return;
      }
      if (!pinned || holding) return;
      holding = true;
      requestAnimationFrame(() => {
        holding = false;
        if (!pinned || menuIsOpen()) {
          pinned = false;
          return;
        }
        const { drift } = metrics();
        if (Math.abs(drift) > 2) scroller.scrollTop += drift;
      });
    };

    const applyScrollDelta = (delta: number): boolean => {
      if (delta === 0 || menuIsOpen()) return false;
      const goingDown = delta > 0;

      if (sectionLeftView()) {
        pinned = false;
        releaseDir = null;
        accumulated = 0;
        return false;
      }

      if (!pinned) {
        if (!sectionReachedPin()) return false;
        const blocked =
          (releaseDir === "down" && goingDown) ||
          (releaseDir === "up" && !goingDown);
        if (blocked) return false;
        pinned = true;
        releaseDir = null;
        if (goingDown && activeIndexRef.current !== 0) goTo(0);
        if (!goingDown && activeIndexRef.current !== lastIndex) {
          goTo(lastIndex);
        }
      }

      const index = activeIndexRef.current;
      const canAdvance = goingDown && index < lastIndex;
      const canRetreat = !goingDown && index > 0;
      if (!canAdvance && !canRetreat) {
        pinned = false;
        releaseDir = goingDown ? "down" : "up";
        accumulated = 0;
        return false;
      }

      holdPin();
      const now = performance.now();
      if (now < cooldownUntil) return true;

      accumulated += delta;
      if (accumulated >= POSTER_SCROLL_STEP) {
        accumulated -= POSTER_SCROLL_STEP;
        cooldownUntil = now + POSTER_SCROLL_COOLDOWN_MS;
        goTo(index + 1);
      } else if (accumulated <= -POSTER_SCROLL_STEP) {
        accumulated += POSTER_SCROLL_STEP;
        cooldownUntil = now + POSTER_SCROLL_COOLDOWN_MS;
        goTo(index - 1);
      }
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      const delta =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if (applyScrollDelta(delta)) event.preventDefault();
    };

    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? lastTouchY;
      const delta = lastTouchY - y;
      lastTouchY = y;
      if (applyScrollDelta(delta)) event.preventDefault();
    };

    const onScroll = () => {
      if (menuIsOpen()) {
        pinned = false;
        return;
      }
      if (pinned) holdPin();
    };

    const opts: AddEventListenerOptions = { passive: false, capture: true };
    scroller.addEventListener("wheel", onWheel, opts);
    scroller.addEventListener("touchstart", onTouchStart, opts);
    scroller.addEventListener("touchmove", onTouchMove, opts);
    scroller.addEventListener("scroll", onScroll);
    return () => {
      scroller.removeEventListener("wheel", onWheel, opts);
      scroller.removeEventListener("touchstart", onTouchStart, opts);
      scroller.removeEventListener("touchmove", onTouchMove, opts);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [goTo, items.length, variant]);

  const activeItem = items[activeIndex];
  const statusText = activeItem
    ? `${itemNoun} ${activeIndex + 1} of ${items.length}${
        activeItem.label ? `: ${activeItem.label}` : ""
      }`
    : "";

  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 340, damping: 32, mass: 0.85 };

  const stageStyle = {
    "--cover-flow-side-offset": sideOffset ?? undefined,
    "--cover-flow-neighbor-1-scale": neighbor1Scale ?? undefined,
    "--cover-flow-neighbor-2-scale": neighbor2Scale ?? undefined,
    "--cover-flow-max-rotation": maxRotation ?? undefined,
  } as CSSProperties;

  const behavior = DEFAULT_VARIANT_BEHAVIOR[variant];
  const resolvedSideOffset = sideOffset ?? behavior.sideOffset;
  const resolvedNeighbor1 = neighbor1Scale ?? behavior.neighbor1Scale;
  const resolvedNeighbor2 = neighbor2Scale ?? behavior.neighbor2Scale;
  const resolvedRotation = maxRotation ?? behavior.maxRotation;
  const resolvedVisible = behavior.maxVisibleOffset;
  const tilt = behavior.tilt;

  const visibleItems =
    wrapSlots && items.length > 0
      ? POSTER_SLOT_OFFSETS.map((offset) => {
          const itemIndex = wrapIndex(activeIndex + offset, items.length);
          return { offset, itemIndex, item: items[itemIndex] };
        })
      : items.map((item, index) => ({
          offset: index - activeIndex,
          itemIndex: index,
          item,
        }));

  return (
    <section
      ref={rootRef}
      className={`project-cover-flow project-cover-flow--${variant}`}
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      onKeyDown={onKeyDown}
      tabIndex={0}
      style={stageStyle}
    >
      <motion.div
        className="project-cover-flow__stage"
        drag={reduceMotion ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        dragMomentum={false}
        onDrag={(_, info) => {
          dragX.set(info.offset.x);
        }}
        onDragEnd={finishDrag}
      >
        <button
          type="button"
          className="project-cover-flow__peek project-cover-flow__peek--prev"
          aria-label={`Previous ${itemNoun.toLowerCase()}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            goPrevious();
          }}
        />
        <button
          type="button"
          className="project-cover-flow__peek project-cover-flow__peek--next"
          aria-label={`Next ${itemNoun.toLowerCase()}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            goNext();
          }}
        />
        <motion.div className="project-cover-flow__track" style={{ x: dragX }}>
          {visibleItems.map(({ offset, itemIndex, item }) => {
            const transform = itemTransform(
              offset,
              resolvedSideOffset,
              resolvedNeighbor1,
              resolvedNeighbor2,
              resolvedRotation,
              resolvedVisible,
              tilt,
              item.scale ?? 1,
              behavior.centerScale,
              behavior.outerOpacity,
            );
            const isActive = offset === 0;

            return (
              <motion.figure
                key={
                  wrapSlots && items.length < 3
                    ? `slot-${offset}`
                    : `${itemIndex}-${item.src}`
                }
                className={
                  isActive
                    ? "project-cover-flow__item project-cover-flow__item--active"
                    : "project-cover-flow__item"
                }
                role={isActive ? undefined : "button"}
                tabIndex={isActive ? undefined : 0}
                aria-hidden={false}
                aria-label={
                  isActive
                    ? undefined
                    : `Show ${item.label ?? `${itemNoun} ${itemIndex + 1}`}`
                }
                style={{
                  zIndex: transform.zIndex,
                  pointerEvents: isActive ? "none" : "auto",
                  cursor: isActive ? undefined : "pointer",
                }}
                animate={{
                  x: `calc(-50% + ${transform.x}px)`,
                  y: "-50%",
                  scale: transform.scale,
                  rotate: transform.rotate,
                  opacity: transform.opacity,
                }}
                transition={transition}
                onPointerDown={(event) => {
                  if (!isActive) event.stopPropagation();
                }}
                onTap={() => {
                  if (isActive) return;
                  stepWrap(offset > 0 ? 1 : -1);
                }}
                onKeyDown={(event) => {
                  if (isActive) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    stepWrap(offset > 0 ? 1 : -1);
                  }
                }}
              >
                <Image
                  src={item.src}
                  alt={isActive ? item.alt : ""}
                  fill
                  className="project-cover-flow__image"
                  draggable={false}
                  sizes={variant === "poster" ? "341px" : "428px"}
                  style={{
                    objectPosition: item.objectPosition ?? "center",
                  }}
                />
              </motion.figure>
            );
          })}
        </motion.div>
      </motion.div>

      <p id={statusId} className="project-cover-flow__status" aria-live="polite">
        {statusText}
      </p>
    </section>
  );
}
