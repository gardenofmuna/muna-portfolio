"use client";

import Image from "next/image";

import type { CoverFlowItem, CoverFlowVariant } from "@/components/project/CoverFlowCarousel";

type Props = {
  items: CoverFlowItem[];
  ariaLabel: string;
  variant: CoverFlowVariant;
};

/** Figma mobile: side-by-side gallery that peeks off the right and scrolls horizontally. */
export function ProjectHorizontalStrip({ items, ariaLabel, variant }: Props) {
  return (
    <div
      className={`project-hscroll project-hscroll--${variant}`}
      role="region"
      aria-label={ariaLabel}
    >
      <ul className="project-hscroll__track">
        {items.map((item) => (
          <li key={item.src} className="project-hscroll__item">
            <Image
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              className="project-hscroll__image"
              sizes={variant === "poster" ? "72vw" : "90vw"}
              draggable={false}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
