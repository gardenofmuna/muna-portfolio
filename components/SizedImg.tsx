/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

/**
 * Serves pre-made sizes of a photograph straight from /public, skipping the
 * Next image optimizer (which caps at 1280px and re-compresses at quality 75).
 * For /dir/name.webp the 800 and 1400px copies live at /dir/v/name-800.webp
 * and /dir/v/name-1400.webp; the file itself is the full size. Phones pick a
 * light copy, large retina screens the full one. Nothing is sharpened.
 */
const STEPS = [800, 1400, 2000];

export function srcSetFor(src: string, width: number) {
  const m = src.match(/^(.*)\/([^/]+)\.webp$/);
  if (!m) return `${src} ${width}w`;
  const [, dir, name] = m;
  return [
    ...STEPS.filter((w) => w < width).map((w) => `${dir}/v/${name}-${w}.webp ${w}w`),
    `${src} ${width}w`,
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
  return (
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
    />
  );
}
