"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

import { ABOUT_BIO_INK } from "@/components/AboutBio";
import { useDesignProjectNav } from "@/components/project/DesignProjectNav";
import {
  DEVAULT_PRESENTS_SLUG,
  DOC_NOW_SLUG,
  EGWU_RECORDS_SLUG,
} from "@/data/projects";
import { DESKTOP_LAYOUT_H } from "@/lib/desktop-stage";

import "@/components/design-landing.css";

/**
 * Photoshop artboard 2795×1578 → layout 1440×811.5 (uniform by height).
 * Type (47.6px) is master÷2 ≈ this same scale — keep them locked together.
 */
const PS_ARTBOARD_H = 1578;
const PS_TO_LAYOUT = DESKTOP_LAYOUT_H / PS_ARTBOARD_H;
/** Nudge the whole composition down so EGWÚ’s tilt isn’t clipped at y=0. */
const DESIGN_LANDING_NUDGE_Y = 28;

/**
 * Live assets fill the PS frame more than the mockup smart objects.
 * Shrink every hover from the PS top-left (not the center) so bottoms
 * clear the list the same way as the mockup.
 */
const FILL_HEAVY_VISUAL = 0.82;
/** Match EGWÚ’s frame width for the square hovers. */
const EGWU_HOVER_W = 562;

function psBox(
  left: number,
  top: number,
  w: number,
  h: number,
  rotate: number,
  visual = FILL_HEAVY_VISUAL,
) {
  return {
    left: left * PS_TO_LAYOUT,
    top: top * PS_TO_LAYOUT,
    w: w * visual * PS_TO_LAYOUT,
    h: h * visual * PS_TO_LAYOUT,
    rotate,
  };
}

/* Text box */
const DESIGN_LIST_LEFT = 843.82 * PS_TO_LAYOUT;
const DESIGN_LIST_TOP = 361.72 * PS_TO_LAYOUT;
const DESIGN_LIST_WIDTH = 1044.18 * PS_TO_LAYOUT;

/* Hover placements — Photoshop Transforms on 2795×1578 */
const PREVIEW_SCATTER: ReadonlyArray<{
  left: number;
  top: number;
  w: number;
  h: number;
  rotate: number;
}> = [
  /* 01 EGWÚ — VF1.png */
  psBox(1651, 59, EGWU_HOVER_W, 620, -21.36),
  /* 02 DOC NOW — Social Media Posts - General Poster.png */
  psBox(1844, 401, 616, 617, -20.52),
  /* 03 DEVAULT — DP V2 FINAL.jpg (slightly right of PS 1894) */
  psBox(1950, 614, EGWU_HOVER_W, EGWU_HOVER_W, -17.83),
  /* 04 BOUNCE — Background copy.psb */
  psBox(1697, 814, EGWU_HOVER_W, EGWU_HOVER_W, -5.13),
  /* 05 STUDIO ORRY — design-2.webp */
  psBox(1584, 1001, EGWU_HOVER_W, EGWU_HOVER_W, -5.67),
  /* 06 MIYA — Test3.tif */
  psBox(1141, 1050, 398, 514, 7.83),
];

type DesignLandingItem = {
  id: string;
  title: string;
  slug?: string;
  /** Hover underline — same inks as the coloured bio spans */
  underline: string;
  preview: { src: string; width: number; height: number; alt: string };
};

/** Desktop design index — hover swaps the tilted preview. */
export const DESIGN_LANDING_ITEMS: DesignLandingItem[] = [
  {
    id: "01",
    title: "EGWÚ RECORDS",
    slug: EGWU_RECORDS_SLUG,
    /* Warm red / pink / orange poster → cool green */
    underline: ABOUT_BIO_INK.medium,
    preview: {
      src: "/projects/egwu/posters/poster-02.webp",
      width: 1080,
      height: 1350,
      alt: "EGWÚ Community Event poster",
    },
  },
  {
    id: "02",
    title: "DOC NOW 2025",
    slug: DOC_NOW_SLUG,
    /* Mustard / sepia grid → blue-violet */
    underline: ABOUT_BIO_INK.afro,
    preview: {
      src: "/design-hovers/doc-now-hover.png",
      width: 1080,
      height: 1350,
      alt: "DOC NOW 2025 poster",
    },
  },
  {
    id: "03",
    title: "DEVAULT PRESENTS",
    slug: DEVAULT_PRESENTS_SLUG,
    /* Grey portraits + blue letter block → yellow */
    underline: ABOUT_BIO_INK.toronto,
    preview: {
      src: "/design-hovers/devault-hover.jpg",
      width: 6000,
      height: 6000,
      alt: "Devault Presents podcast cover",
    },
  },
  {
    id: "04",
    title: "BOUNCE RADIO",
    /* Lime green waves → magenta pink */
    underline: ABOUT_BIO_INK.lagos,
    preview: {
      src: "/BOUNCE RADIO HOVER.webp",
      width: 2265,
      height: 2268,
      alt: "Bounce Radio preview",
    },
  },
  {
    id: "05",
    title: "STUDIO ORRY",
    /* Orange circles → blue */
    underline: ABOUT_BIO_INK.blue,
    preview: {
      src: "/design-2.webp",
      width: 505,
      height: 505,
      alt: "Studio Orry preview",
    },
  },
  {
    id: "06",
    title: "MIYA",
    /* Cool B&W / teal collage → warm orange */
    underline: ABOUT_BIO_INK.interdisciplinary,
    preview: {
      src: "/MIYA HOVER.webp",
      width: 1481,
      height: 2074,
      alt: "Miya preview",
    },
  },
];

type Props = {
  visible: boolean;
};

/**
 * Desktop-only design landing: numbered index + one tilted preview on hover.
 */
export function DesignLandingIndex({ visible }: Props) {
  const nav = useDesignProjectNav();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
    if (!visible) setActiveIndex(null);
  }, [visible]);

  const fadeMs = reduceMotion ? 80 : 520;
  const hovering = activeIndex !== null;
  const item = hovering
    ? DESIGN_LANDING_ITEMS[activeIndex]
    : null;
  const scatter = hovering
    ? PREVIEW_SCATTER[activeIndex]!
    : PREVIEW_SCATTER[0]!;

  return (
    <div
      className="design-landing pointer-events-none absolute inset-0 z-[50] select-none overflow-visible"
      aria-hidden={!visible}
      data-visible={visible ? "" : undefined}
      style={{
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        transform: `translateY(${DESIGN_LANDING_NUDGE_Y}px)`,
        transition: reduceMotion
          ? "none"
          : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <div
        className="design-landing__list-wrap absolute overflow-visible"
        style={{
          left: DESIGN_LIST_LEFT,
          top: DESIGN_LIST_TOP,
          width: DESIGN_LIST_WIDTH,
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <ul
          className="design-landing-list"
          onMouseLeave={() => setActiveIndex(null)}
        >
          {DESIGN_LANDING_ITEMS.map((row, index) => {
            const hot = index === activeIndex;
            const opens = Boolean(row.slug && nav);
            return (
              <li key={row.id} className="design-landing-list__row">
                <button
                  type="button"
                  className="design-landing-list__item"
                  data-active={hot ? "" : undefined}
                  tabIndex={visible ? 0 : -1}
                  aria-current={hot ? "true" : undefined}
                  aria-label={`[${row.id}] ${row.title}`}
                  onPointerEnter={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (!e.currentTarget.closest("ul")?.contains(next)) {
                      setActiveIndex(null);
                    }
                  }}
                  onClick={() => {
                    if (row.slug) nav?.goToProject(row.slug);
                  }}
                  style={
                    {
                      cursor: opens ? "pointer" : "default",
                      "--design-underline": row.underline,
                    } as CSSProperties
                  }
                >
                  <span className="design-landing-list__title">
                    <span className="design-landing-list__num" aria-hidden>
                      <span className="design-landing-list__br">[</span>
                      <span className="design-landing-list__digits">
                        {row.id}
                      </span>
                      <span className="design-landing-list__br">]</span>
                    </span>
                    {row.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className="design-landing__preview-wrap pointer-events-none absolute"
        style={{
          left: scatter.left,
          top: scatter.top,
          width: scatter.w,
          height: scatter.h,
          opacity: hovering && item ? 1 : 0,
          visibility: hovering && item ? "visible" : "hidden",
          transition: reduceMotion
            ? "none"
            : "left 280ms cubic-bezier(0.22, 1, 0.36, 1), top 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease, visibility 180ms ease",
        }}
      >
        {item ? (
          <div
            className="design-landing-preview"
            aria-hidden={!visible}
          >
            <div
              className="design-landing-preview__clip"
              style={{
                transform: reduceMotion
                  ? undefined
                  : `rotate(${scatter.rotate}deg)`,
                transition: reduceMotion
                  ? "none"
                  : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <Image
                key={item.preview.src}
                src={item.preview.src}
                alt={visible ? item.preview.alt : ""}
                fill
                className="design-landing-preview__image"
                sizes={`${Math.round(scatter.w * 2)}px`}
                priority={false}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
