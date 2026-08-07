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

const DEFAULT_VARIANT_BEHAVIOR = {
  poster: {
    sideOffset: 92,
    neighbor1Scale: 0.76,
    neighbor2Scale: 0.6,
    maxRotation: 28,
  },
  merchandise: {
    sideOffset: 80,
    neighbor1Scale: 0.74,
    neighbor2Scale: 0.58,
    maxRotation: 22,
  },
} as const;

const SWIPE_OFFSET_PX = 52;
const SWIPE_VELOCITY = 320;

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(length - 1, index));
}

function scaleForOffset(
  abs: number,
  neighbor1Scale: number,
  neighbor2Scale: number,
) {
  if (abs === 0) return 1;
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
  itemScale = 1,
) {
  const abs = Math.abs(offset);
  if (abs > maxVisibleOffset) {
    return {
      x: offset * sideOffset * 0.45,
      scale: 0.48 * itemScale,
      rotateY: offset > 0 ? maxRotation : -maxRotation,
      zIndex: 0,
      opacity: 0,
    };
  }

  const scale = scaleForOffset(abs, neighbor1Scale, neighbor2Scale) * itemScale;
  const rotateY = -offset * (maxRotation / 2.4);

  return {
    x: offset * sideOffset,
    scale,
    rotateY,
    zIndex: 100 - abs,
    opacity: abs > 2 ? 0.68 : 1,
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
  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(initialIndex, items.length),
  );
  const dragX = useMotionValue(0);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(clampIndex(index, items.length));
    },
    [items.length],
  );

  const goPrevious = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

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

  return (
    <section
      className={`project-cover-flow project-cover-flow--${variant}`}
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      onKeyDown={onKeyDown}
      tabIndex={0}
      style={stageStyle}
    >
      <div
        className="project-cover-flow__controls"
        aria-hidden={items.length <= 1}
      >
        <button
          type="button"
          className="project-cover-flow__control project-cover-flow__control--prev"
          aria-label={`Previous ${itemNoun.toLowerCase()}`}
          onClick={goPrevious}
          disabled={activeIndex === 0}
        >
          ‹
        </button>
        <button
          type="button"
          className="project-cover-flow__control project-cover-flow__control--next"
          aria-label={`Next ${itemNoun.toLowerCase()}`}
          onClick={goNext}
          disabled={activeIndex === items.length - 1}
        >
          ›
        </button>
      </div>

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
        <motion.div className="project-cover-flow__track" style={{ x: dragX }}>
          {items.map((item, index) => {
            const offset = index - activeIndex;
            const transform = itemTransform(
              offset,
              resolvedSideOffset,
              resolvedNeighbor1,
              resolvedNeighbor2,
              resolvedRotation,
              3,
              item.scale ?? 1,
            );
            const isActive = index === activeIndex;

            return (
              <motion.figure
                key={item.src}
                className={
                  isActive
                    ? "project-cover-flow__item project-cover-flow__item--active"
                    : "project-cover-flow__item"
                }
                aria-hidden={!isActive}
                style={{
                  zIndex: transform.zIndex,
                  pointerEvents: isActive ? "auto" : "none",
                }}
                animate={{
                  x: `calc(-50% + ${transform.x}px)`,
                  y: "-50%",
                  scale: transform.scale,
                  rotateY: transform.rotateY,
                  opacity: transform.opacity,
                }}
                transition={transition}
              >
                <Image
                  src={item.src}
                  alt={isActive ? item.alt : ""}
                  width={item.width}
                  height={item.height}
                  className="project-cover-flow__image"
                  draggable={false}
                  sizes={
                    variant === "poster"
                      ? "(max-width: 960px) 60vw, 20rem"
                      : "(max-width: 960px) 55vw, 22rem"
                  }
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
