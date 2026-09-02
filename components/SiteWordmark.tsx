"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEventHandler } from "react";

import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { NARROW_NZERIBE } from "@/lib/narrow-stage";

type Props = {
  /** Reserved for contact view — asset matches desktop (no filter). */
  inverted?: boolean;
  /** When set, the wordmark is a home link (project pages). */
  href?: string;
  /** In-flow wordmark (scrolling project) vs absolute Artboard_2 placement. */
  placement?: "artboard" | "flow";
  /**
   * Fixed CSS-px distance from the viewport left edge (narrow landing).
   * When set, overrides artboard X so the gap stays constant across screen sizes.
   */
  screenLeft?: number;
  /**
   * Fixed CSS-px distance from the viewport top (narrow landing).
   * Keeps the tilted "nzeribe" clear of PAGE_SCALE letterbox crop.
   */
  screenTop?: number;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/** Top-left nzeribe1.webp on Artboard_2 — matches Figma comp. */
export function SiteWordmark({
  inverted: _inverted = false,
  href,
  placement = "artboard",
  screenLeft,
  screenTop,
  onClick,
}: Props) {
  const { u, ox, oy } = useNarrowArtboardMetrics();
  const image = (
    <Image
      src="/nzeribe1.webp"
      alt="Muna Nzeribe"
      width={546}
      height={117}
      className="block h-full w-full object-contain object-left object-top"
      sizes={`${NARROW_NZERIBE.w}px`}
      priority
    />
  );

  if (placement === "flow") {
    const className = "project-narrow__wordmark";
    // Same CSS-px box as the landing artboard wordmark (JS u, not CSS 100vh).
    const style = {
      width: NARROW_NZERIBE.w * (u || 1),
      height: NARROW_NZERIBE.h * (u || 1),
    };
    if (href) {
      return (
        <Link
          href={href}
          className={className}
          style={style}
          aria-label="Back to home"
          onClick={onClick}
        >
          {image}
        </Link>
      );
    }
    return (
      <div className={className} style={style} aria-label="Muna Nzeribe">
        {image}
      </div>
    );
  }

  const scale = u || 1;
  const left =
    screenLeft == null ? NARROW_NZERIBE.x : (screenLeft - ox) / scale;
  const top =
    screenTop == null ? NARROW_NZERIBE.y : (screenTop - oy) / scale;

  return (
    <div
      className="pointer-events-none absolute z-[35] select-none overflow-visible"
      style={{
        left,
        top,
        width: NARROW_NZERIBE.w,
        height: NARROW_NZERIBE.h,
      }}
      aria-label="Muna Nzeribe"
    >
      {image}
    </div>
  );
}
