"use client";

import Image from "next/image";

import type { CoverFlowItem, CoverFlowVariant } from "@/components/project/CoverFlowCarousel";

export type HorizontalStripVariant = CoverFlowVariant | "website";

type Props = {
  items: CoverFlowItem[];
  ariaLabel: string;
  variant: HorizontalStripVariant;
};

function isGif(src: string) {
  return /\.gif(?:$|\?)/i.test(src);
}

function displaySize(item: CoverFlowItem) {
  const maxEdge = 1200;
  const edge = Math.max(item.width, item.height);
  if (edge <= maxEdge) {
    return { width: item.width, height: item.height };
  }
  const scale = maxEdge / edge;
  return {
    width: Math.round(item.width * scale),
    height: Math.round(item.height * scale),
  };
}

function needsUnoptimized(src: string) {
  return /\.(?:svg|gif)(?:$|\?)/i.test(src);
}

/** Figma mobile: side-by-side gallery that peeks off the right and scrolls horizontally. */
export function ProjectHorizontalStrip({ items, ariaLabel, variant }: Props) {
  const visibleItems = items.filter(
    (item) => item.kind !== "video" && !isGif(item.src),
  );

  return (
    <div
      className={`project-hscroll project-hscroll--${variant}`}
      role="region"
      aria-label={ariaLabel}
    >
      <ul className="project-hscroll__track">
        {visibleItems.map((item) => {
          const size = displaySize(item);
          return (
            <li key={item.src} className="project-hscroll__item">
              <Image
                src={item.src}
                alt={item.alt}
                width={size.width}
                height={size.height}
                className="project-hscroll__image"
                sizes={
                  variant === "website"
                    ? "(max-width: 900px) 92vw, 560px"
                    : variant === "poster"
                      ? "72vw"
                      : "90vw"
                }
                draggable={false}
                loading="lazy"
                unoptimized={needsUnoptimized(item.src)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
