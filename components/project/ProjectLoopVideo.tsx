"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  poster?: string;
  /** Cover-flow peeks stay unloaded until the card is centered. */
  active?: boolean;
};

/**
 * Looping muted clip that does not attach src until it is on screen.
 * The DOC NOW recordings are 50MB+; mounting them on page load crashes iOS.
 */
export function ProjectLoopVideo({
  src,
  alt,
  width,
  height,
  className,
  poster,
  active = true,
}: Props) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const shouldLoad = active && inView;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root: null, rootMargin: "80px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!shouldLoad) {
      el.pause();
      if (el.getAttribute("src")) {
        el.removeAttribute("src");
        el.load();
      }
      return;
    }

    if (el.getAttribute("src") !== src) {
      el.src = src;
      el.load();
    }
    if (!reduceMotion) {
      void el.play().catch(() => {
        /* Autoplay can be blocked; clip stays muted for a later attempt. */
      });
    }
  }, [reduceMotion, shouldLoad, src]);

  return (
    <video
      ref={ref}
      className={className}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      aria-label={alt}
    />
  );
}
