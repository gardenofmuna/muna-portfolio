"use client";

import type { CSSProperties } from "react";

import avifNames from "@/data/efuru-avif.json";

/* Photographs that also have AVIF copies: only those where AVIF came out
   clearly smaller at the same measured quality (SSIMULACRA2). */
const HAS_AVIF = new Set<string>(avifNames);

/**
 * Serves pre-made sizes of a photograph straight from /public, skipping the
 * Next image optimizer (which caps at 1280px and re-compresses at quality 75).
 * For /dir/name.webp the 800 and 1400px copies live at /dir/v/name-800.webp
 * and /dir/v/name-1400.webp; the file itself is the full size. Phones pick a
 * light copy, large retina screens the full one. Nothing is sharpened.
 */
const STEPS = [800, 1400, 2000];

export function srcSetFor(
  src: string,
  width: number,
  ext: "webp" | "avif" = "webp",
) {
  const m = src.match(/^(.*)\/([^/]+)\.webp$/);
  if (!m) return `${src} ${width}w`;
  const [, dir, name] = m;
  return [
    ...STEPS.filter((w) => w < width).map(
      (w) => `${dir}/v/${name}-${w}.${ext} ${w}w`,
    ),
    `${dir}/${name}.${ext} ${width}w`,
  ].join(", ");
}

export function SizedImg({
  src,
  width,
  height,
  alt,
  sizes,
  className,
  style,
  eager,
  priority,
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
  /** "high" for the photograph on screen, "low" for ones fetched ahead. */
  priority?: "high" | "low" | "auto";
}) {
  /* AVIF first (about a third smaller at the same look), WebP for
     browsers without AVIF. <picture> is display: contents, so layout is
     exactly as if the <img> stood alone. */
  return (
    <picture style={{ display: "contents" }}>
      {HAS_AVIF.has(src.replace(/^.*\//, "").replace(/\.webp$/, "")) ? (
        <source
          type="image/avif"
          srcSet={srcSetFor(src, width, "avif")}
          sizes={sizes}
        />
      ) : null}
      <img
        src={src}
        srcSet={srcSetFor(src, width)}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        className={className}
        style={style}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority}
        /* Marks the photo as loaded so it can fade in (see .efuru-pic img).
           Photos already in the cache finish before scripts run, so the ref
           checks for those too. */
        ref={(el) => {
          if (el && el.complete && el.naturalWidth) el.dataset.loaded = "";
        }}
        onLoad={(e) => {
          e.currentTarget.dataset.loaded = "";
        }}
      />
    </picture>
  );
}
