"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";

import type { CoverFlowItem, CoverFlowVariant } from "@/components/project/CoverFlowCarousel";
import { ProjectLoopVideo } from "@/components/project/ProjectLoopVideo";

export type HorizontalStripVariant = CoverFlowVariant | "website";

type Props = {
  items: CoverFlowItem[];
  ariaLabel: string;
  variant: HorizontalStripVariant;
};

function displaySize(item: CoverFlowItem) {
  const maxEdge = 1080;
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

function syncEdgeFades(scroller: HTMLElement, wrap: HTMLElement) {
  const max = scroller.scrollWidth - scroller.clientWidth;
  const left = scroller.scrollLeft;
  wrap.toggleAttribute("data-fade-left", left > 4);
  wrap.toggleAttribute("data-fade-right", max > 4 && max - left > 4);
}

/** Figma mobile: side-by-side gallery that peeks off the right and scrolls horizontally. */
export function ProjectHorizontalStrip({ items, ariaLabel, variant }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const wrap = wrapRef.current;
    if (!scroller || !wrap) return;

    const sync = () => syncEdgeFades(scroller, wrap);
    sync();

    scroller.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(scroller);
    const track = scroller.firstElementChild;
    if (track instanceof HTMLElement) ro.observe(track);

    const imgs = [...scroller.querySelectorAll("img")];
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", sync);
    });

    return () => {
      scroller.removeEventListener("scroll", sync);
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", sync));
    };
  }, [items]);

  return (
    <div ref={wrapRef} className="project-hscroll-wrap">
      <div
        ref={scrollerRef}
        className={`project-hscroll project-hscroll--${variant}`}
        role="region"
        aria-label={ariaLabel}
      >
        <ul className="project-hscroll__track">
          {items.map((item) => {
            const size = displaySize(item);
            return (
              <li key={item.src} className="project-hscroll__item">
                {item.kind === "video" ? (
                  <ProjectLoopVideo
                    src={item.src}
                    alt={item.alt}
                    width={size.width}
                    height={size.height}
                    poster={item.poster}
                    className="project-hscroll__image project-hscroll__video"
                  />
                ) : (
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
                          ? "(max-width: 900px) 72vw, 342px"
                          : "(max-width: 900px) 90vw, 428px"
                    }
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    quality={70}
                    unoptimized={needsUnoptimized(item.src)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
