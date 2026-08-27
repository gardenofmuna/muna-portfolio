"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";

import type { CoverFlowItem, CoverFlowVariant } from "@/components/project/CoverFlowCarousel";

export type HorizontalStripVariant = CoverFlowVariant | "website";

type Props = {
  items: CoverFlowItem[];
  ariaLabel: string;
  variant: HorizontalStripVariant;
};

function needsUnoptimized(src: string) {
  return /\.(?:svg|gif)(?:$|\?)/i.test(src);
}

/** Figma mobile: side-by-side gallery that peeks off the right and scrolls horizontally. */
export function ProjectHorizontalStrip({ items, ariaLabel, variant }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`project-hscroll project-hscroll--${variant}`}
      role="region"
      aria-label={ariaLabel}
    >
      <ul className="project-hscroll__track">
        {items.map((item) => (
          <li key={item.src} className="project-hscroll__item">
            {item.kind === "video" ? (
              <video
                className="project-hscroll__image project-hscroll__video"
                src={item.src}
                width={item.width}
                height={item.height}
                autoPlay={!reduceMotion}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={item.alt}
              />
            ) : (
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="project-hscroll__image"
                sizes={
                  variant === "website"
                    ? "(max-width: 900px) 92vw, 560px"
                    : variant === "poster"
                      ? "72vw"
                      : "90vw"
                }
                draggable={false}
                unoptimized={needsUnoptimized(item.src)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
