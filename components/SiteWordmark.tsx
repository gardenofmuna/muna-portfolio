"use client";

import Image from "next/image";

import { NARROW_NZERIBE } from "@/lib/narrow-stage";

type Props = {
  /** Reserved for contact view — asset matches desktop (no filter). */
  inverted?: boolean;
};

/** Top-left nzeribe1.webp on Artboard_2 — matches Figma comp. */
export function SiteWordmark({ inverted: _inverted = false }: Props) {
  return (
    <div
      className="pointer-events-none absolute z-[35] select-none"
      style={{
        left: NARROW_NZERIBE.x,
        top: NARROW_NZERIBE.y,
        width: NARROW_NZERIBE.w,
        height: NARROW_NZERIBE.h,
      }}
      aria-label="Muna Nzeribe"
    >
      <Image
        src="/nzeribe1.webp"
        alt="Muna Nzeribe"
        width={546}
        height={117}
        className="block h-full w-full object-contain object-left object-top"
        sizes={`${NARROW_NZERIBE.w}px`}
        priority
      />
    </div>
  );
}
