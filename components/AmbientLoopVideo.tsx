"use client";

import { useEffect, useRef } from "react";

/**
 * A silent video that plays on a loop with no controls, like a moving
 * photograph. It only plays while on screen (saves battery and data), and
 * phones get a lighter copy. Shows the poster frame until it starts.
 */
export function AmbientLoopVideo({
  src,
  srcMobile,
  poster,
  width,
  height,
  label,
  caption,
}: {
  src: string;
  srcMobile?: string;
  poster?: string;
  width: number;
  height: number;
  label: string;
  caption?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true; // iOS needs the property, not only the attribute
    /* Phones get the lighter copy (browsers ignore media= on video sources
       unevenly, so choose here). */
    const pick =
      srcMobile && window.matchMedia("(max-width: 899px)").matches
        ? srcMobile
        : src;
    if (v.getAttribute("src") !== pick) v.setAttribute("src", pick);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          void v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src, srcMobile]);

  return (
    <figure className="ambient-video">
      <div
        className="ambient-video__frame"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <video
          ref={ref}
          className="ambient-video__media"
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          poster={poster}
          aria-label={label}
          disablePictureInPicture
          controls={false}
        />
      </div>
      {caption ? (
        <figcaption className="installation-show__media-caption ambient-video__caption">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
