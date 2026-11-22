"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SizedImg } from "@/components/SizedImg";
import type { InstallationGalleryImage } from "@/data/installation";

/**
 * One photograph at a time in a fixed frame, with a row of thumbnails and
 * arrows beneath (after the NYPL exhibition slideshows). Every photograph is
 * shown whole: it is fitted inside the frame, never cropped or enlarged past
 * its own size, and thumbnails keep their own proportions too.
 */
export function ExhibitionSlideshow({
  images,
  ariaLabel,
}: {
  images: readonly InstallationGalleryImage[];
  ariaLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const n = images.length;
  /* Only photographs you have reached, plus the next and previous, load. */
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1, 2, n - 1]));

  const go = useCallback(
    (i: number) => {
      const k = ((i % n) + n) % n;
      setIndex(k);
      setSeen((prev) => {
        const want = [k, (k + 1) % n, (k - 1 + n) % n, (k + 2) % n];
        if (want.every((j) => prev.has(j))) return prev;
        const next = new Set(prev);
        want.forEach((j) => next.add(j));
        return next;
      });
    },
    [n],
  );

  /* Keep the active thumbnail in view without moving the page. */
  useEffect(() => {
    const row = thumbsRef.current;
    const el = row?.children[index] as HTMLElement | undefined;
    if (!row || !el) return;
    const target = el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [index]);

  const current = images[index];

  return (
    <div
      className="exhibition-slideshow"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div
        className="exhibition-slideshow__stage"
        style={{ ["--ss-ar" as string]: `${current.width} / ${current.height}` }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {images.map((img, i) => (
          <div
            key={img.src}
            className="exhibition-slideshow__slide"
            data-active={i === index ? "" : undefined}
            aria-hidden={i !== index}
          >
            {seen.has(i) ? (
              <SizedImg
                src={img.src!}
                width={img.width}
                height={img.height}
                alt={img.alt ?? ""}
                sizes="(min-width: 900px) 80vw, 100vw"
                className="exhibition-slideshow__img"
                style={{ maxWidth: `min(100%, ${img.width}px)`, maxHeight: `min(100%, ${img.height}px)` }}
                eager
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="exhibition-slideshow__meta">
        <p className="exhibition-slideshow__caption">{current.alt}</p>
        <p className="exhibition-slideshow__count" aria-live="polite">
          {index + 1} / {n}
        </p>
      </div>

      <div className="exhibition-slideshow__nav">
        <button
          type="button"
          className="exhibition-slideshow__arrow"
          aria-label="Previous photograph"
          onClick={() => go(index - 1)}
        >
          <svg viewBox="0 0 12 20" aria-hidden="true"><path d="M10 2 2 10l8 8" /></svg>
        </button>
        <div className="exhibition-slideshow__thumbs" ref={thumbsRef}>
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className="exhibition-slideshow__thumb"
              data-active={i === index ? "" : undefined}
              aria-label={`Show photograph ${i + 1}: ${img.alt ?? ""}`}
              aria-current={i === index}
              onClick={() => go(i)}
              style={{ aspectRatio: `${img.width} / ${img.height}` }}
            >
              <SizedImg
                src={img.src!}
                width={img.width}
                height={img.height}
                alt=""
                sizes="120px"
                className="exhibition-slideshow__thumb-img"
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="exhibition-slideshow__arrow"
          aria-label="Next photograph"
          onClick={() => go(index + 1)}
        >
          <svg viewBox="0 0 12 20" aria-hidden="true"><path d="m2 2 8 8-8 8" /></svg>
        </button>
      </div>
    </div>
  );
}
