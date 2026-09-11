"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { CoverFlowItem } from "@/components/project/CoverFlowCarousel";

const AUTOPLAY_MS = 4200;
const GROUP_SIZE = 3;

function chunkPosters(items: CoverFlowItem[]) {
  const groups: CoverFlowItem[][] = [];
  for (let i = 0; i < items.length; i += GROUP_SIZE) {
    groups.push(items.slice(i, i + GROUP_SIZE));
  }
  return groups;
}

function MarkerIcon({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      width="16"
      height="26"
      viewBox="0 0 16 26"
      aria-hidden
      focusable="false"
    >
      <path
        d={dir === "prev" ? "M15 1 L1 13 L15 25 Z" : "M1 1 L15 13 L1 25 Z"}
        fill="currentColor"
      />
    </svg>
  );
}

type Props = {
  items: CoverFlowItem[];
  ariaLabel: string;
};

/** Devault posters — carousel of three-up staircase rows. */
export function DevaultPosterStairs({ items, ariaLabel }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const groups = chunkPosters(items);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(groups.length > 1);

  const syncEdges = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const left = scroller.scrollLeft;
    setCanPrev(left > 4);
    setCanNext(max > 4 && max - left > 4);
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const wrap = wrapRef.current;
    if (!scroller || !wrap) return;
    syncEdges();
    scroller.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    const ro = new ResizeObserver(syncEdges);
    ro.observe(wrap);
    return () => {
      scroller.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
      ro.disconnect();
    };
  }, [groups.length, syncEdges]);

  const scrollByDir = useCallback((dir: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: dir * scroller.clientWidth,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (groups.length < 2 || reduceMotion) return;
    const wrap = wrapRef.current;
    const scroller = scrollerRef.current;
    if (!wrap || !scroller) return;

    let paused = false;
    let visible = false;
    let timer = 0;

    const advance = () => {
      if (paused || !visible) return;
      const max = scroller.scrollWidth - scroller.clientWidth;
      if (max <= 4) return;
      if (max - scroller.scrollLeft <= 4) {
        scroller.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      scroller.scrollBy({
        left: scroller.clientWidth,
        behavior: "smooth",
      });
    };

    const arm = () => {
      window.clearInterval(timer);
      timer = window.setInterval(advance, AUTOPLAY_MS);
    };
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    const onFocusOut = (event: FocusEvent) => {
      if (!wrap.contains(event.relatedTarget as Node | null)) resume();
    };

    wrap.addEventListener("pointerenter", pause);
    wrap.addEventListener("pointerleave", resume);
    wrap.addEventListener("focusin", pause);
    wrap.addEventListener("focusout", onFocusOut);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      },
      { threshold: [0, 0.2, 0.5] },
    );
    io.observe(wrap);
    arm();

    return () => {
      window.clearInterval(timer);
      wrap.removeEventListener("pointerenter", pause);
      wrap.removeEventListener("pointerleave", resume);
      wrap.removeEventListener("focusin", pause);
      wrap.removeEventListener("focusout", onFocusOut);
      io.disconnect();
    };
  }, [groups.length, reduceMotion]);

  return (
    <div
      ref={wrapRef}
      className="project-hscroll-wrap project-poster-stairs-wrap"
    >
      <button
        type="button"
        className="project-hscroll__control project-hscroll__control--prev"
        aria-label="Previous posters"
        disabled={!canPrev}
        onClick={() => scrollByDir(-1)}
      >
        <MarkerIcon dir="prev" />
      </button>
      <button
        type="button"
        className="project-hscroll__control project-hscroll__control--next"
        aria-label="Next posters"
        disabled={!canNext}
        onClick={() => scrollByDir(1)}
      >
        <MarkerIcon dir="next" />
      </button>
      <div
        ref={scrollerRef}
        className="project-hscroll project-poster-stairs-scroller"
        role="region"
        aria-label={ariaLabel}
        aria-roledescription="carousel"
      >
        <ul className="project-poster-stairs-track">
          {groups.map((group, groupIndex) => {
            const rise = groupIndex % 2 === 1;
            return (
              <li
                key={`stairs-${groupIndex}-${group[0]?.src ?? groupIndex}`}
                className={
                  rise
                    ? "project-poster-stairs project-poster-stairs--rise"
                    : "project-poster-stairs project-poster-stairs--fall"
                }
              >
                {group.map((item, index) => (
                  <figure
                    key={item.src}
                    className={`project-poster-stairs__item project-poster-stairs__item--${index}`}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      className="project-poster-stairs__image"
                      sizes="(max-width: 900px) 42vw, 200px"
                      quality={85}
                    />
                  </figure>
                ))}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
