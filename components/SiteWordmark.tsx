"use client";

import Image from "next/image";
import Link from "next/link";

import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { NARROW_NZERIBE } from "@/lib/narrow-stage";

type Props = {
  /** Reserved for contact view — asset matches desktop (no filter). */
  inverted?: boolean;
  /** When set, the wordmark is a home link (project pages). */
  href?: string;
  /** In-flow wordmark (scrolling project) vs absolute Artboard_2 placement. */
  placement?: "artboard" | "flow";
  /** Screen-space nudge (px) — applied after artboard scale on narrow landing. */
  offsetX?: number;
};

/** Top-left nzeribe1.webp on Artboard_2 — matches Figma comp. */
export function SiteWordmark({
  inverted: _inverted = false,
  href,
  placement = "artboard",
  offsetX = 0,
}: Props) {
  const { u } = useNarrowArtboardMetrics();
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
    if (href) {
      return (
        <Link href={href} className={className} aria-label="Back to home">
          {image}
        </Link>
      );
    }
    return (
      <div className={className} aria-label="Muna Nzeribe">
        {image}
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute z-[35] select-none"
      style={{
        left: NARROW_NZERIBE.x + offsetX / (u || 1),
        top: NARROW_NZERIBE.y,
        width: NARROW_NZERIBE.w,
        height: NARROW_NZERIBE.h,
      }}
      aria-label="Muna Nzeribe"
    >
      {image}
    </div>
  );
}
