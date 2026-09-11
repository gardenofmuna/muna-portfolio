"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { CoverFlowItem, CoverFlowVariant } from "@/components/project/CoverFlowCarousel";
import { ProjectLoopVideo } from "@/components/project/ProjectLoopVideo";
import { readSafari } from "@/lib/safari";

export type HorizontalStripVariant = CoverFlowVariant | "website";

type Props = {
  items: CoverFlowItem[];
  ariaLabel: string;
  variant: HorizontalStripVariant;
};

/** Desktop strip heights in project-pane.css */
const POSTER_STRIP_H = 428;
const MERCH_STRIP_H = 424;
const AUTOPLAY_MS = 3800;

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

function stripDesktopWidth(item: CoverFlowItem, stripH: number) {
  const { width, height } = displaySize(item);
  if (height <= 0) return stripH;
  return Math.round((width / height) * stripH);
}

function needsUnoptimized(src: string) {
  return /\.(?:svg|gif)(?:$|\?)/i.test(src);
}

function syncEdgeFades(scroller: HTMLElement, wrap: HTMLElement) {
  const port =
    wrap.scrollWidth - wrap.clientWidth > 4 ? wrap : scroller;
  const max = port.scrollWidth - port.clientWidth;
  const left = port.scrollLeft;
  wrap.toggleAttribute("data-fade-left", left > 4);
  wrap.toggleAttribute("data-fade-right", max > 4 && max - left > 4);
  return { canPrev: left > 4, canNext: max > 4 && max - left > 4 };
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

function stepWidth(scroller: HTMLElement) {
  const item = scroller.querySelector(
    ".project-hscroll__item",
  ) as HTMLElement | null;
  const track = scroller.querySelector(
    ".project-hscroll__track",
  ) as HTMLElement | null;
  const styles = track ? getComputedStyle(track) : null;
  const gap = styles
    ? Number.parseFloat(styles.columnGap || styles.gap || "80") || 80
    : 80;
  if (item) return item.getBoundingClientRect().width + gap;
  return Math.max(240, scroller.clientWidth * 0.55);
}

/** Side-by-side gallery; desktop pane gets band carousels / autoplay. */
export function ProjectHorizontalStrip({ items, ariaLabel, variant }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const bandVariant =
    variant === "poster" ||
    variant === "merchandise" ||
    variant === "website";
  const [desktopBand, setDesktopBand] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    setDesktopBand(bandVariant && !!wrap.closest(".project-pane"));
  }, [bandVariant, items]);

  const syncEdges = useCallback(() => {
    const scroller = scrollerRef.current;
    const wrap = wrapRef.current;
    if (!scroller || !wrap) return;
    if (desktopBand) {
      const port = scroller;
      const max = port.scrollWidth - port.clientWidth;
      const left = port.scrollLeft;
      setCanPrev(left > 4);
      setCanNext(max > 4 && max - left > 4);
      return;
    }
    const edges = syncEdgeFades(scroller, wrap);
    setCanPrev(edges.canPrev);
    setCanNext(edges.canNext);
  }, [desktopBand]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const wrap = wrapRef.current;
    if (!scroller || !wrap) return;

    if (!desktopBand && readSafari()) wrap.setAttribute("data-safari", "true");
    else wrap.removeAttribute("data-safari");

    syncEdges();

    scroller.addEventListener("scroll", syncEdges, { passive: true });
    wrap.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    const ro = new ResizeObserver(syncEdges);
    ro.observe(wrap);

    const imgs = [...scroller.querySelectorAll("img")];
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", syncEdges);
    });

    return () => {
      scroller.removeEventListener("scroll", syncEdges);
      wrap.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", syncEdges));
    };
  }, [items, variant, desktopBand, syncEdges]);

  const scrollByDir = useCallback((dir: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: dir * stepWidth(scroller), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!desktopBand || items.length < 2 || reduceMotion) return;
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
        left: stepWidth(scroller),
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
  }, [desktopBand, items.length, reduceMotion]);

  return (
    <div
      ref={wrapRef}
      className={
        desktopBand
          ? `project-hscroll-wrap project-hscroll-wrap--${variant}`
          : "project-hscroll-wrap"
      }
    >
      {desktopBand ? (
        <>
          <button
            type="button"
            className="project-hscroll__control project-hscroll__control--prev"
            aria-label={
              variant === "website"
                ? "Previous screenshots"
                : variant === "merchandise"
                  ? "Previous merchandise"
                  : "Previous posters"
            }
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
          >
            <MarkerIcon dir="prev" />
          </button>
          <button
            type="button"
            className="project-hscroll__control project-hscroll__control--next"
            aria-label={
              variant === "website"
                ? "Next screenshots"
                : variant === "merchandise"
                  ? "Next merchandise"
                  : "Next posters"
            }
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
          >
            <MarkerIcon dir="next" />
          </button>
        </>
      ) : null}
      <div
        ref={scrollerRef}
        className={`project-hscroll project-hscroll--${variant}`}
        role="region"
        aria-label={ariaLabel}
        aria-roledescription={desktopBand ? "carousel" : undefined}
      >
        <ul className="project-hscroll__track">
          {items.map((item) => {
            const size = displaySize(item);
            const stripH =
              variant === "poster"
                ? POSTER_STRIP_H
                : variant === "merchandise"
                  ? MERCH_STRIP_H
                  : size.height;
            const stripW =
              variant === "poster" || variant === "merchandise"
                ? stripDesktopWidth(item, stripH)
                : size.width;
            return (
              <li key={item.src} className="project-hscroll__item">
                {item.kind === "video" ? (
                  <ProjectLoopVideo
                    src={item.src}
                    alt={item.alt}
                    width={size.width}
                    height={size.height}
                    poster={variant === "website" ? undefined : item.poster}
                    className="project-hscroll__image project-hscroll__video"
                    togglePlayback={variant === "website"}
                  />
                ) : (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={stripW}
                    height={stripH}
                    className="project-hscroll__image"
                    sizes={
                      variant === "website"
                        ? "(max-width: 900px) 92vw, 85vw"
                        : variant === "poster" || variant === "merchandise"
                          ? `(max-width: 900px) 72vw, ${stripW}px`
                          : "(max-width: 900px) 90vw, 424px"
                    }
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    quality={
                      variant === "poster" ||
                      variant === "merchandise" ||
                      variant === "website"
                        ? 85
                        : 70
                    }
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
