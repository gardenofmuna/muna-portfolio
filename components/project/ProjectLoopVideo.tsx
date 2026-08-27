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

function onScreen(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return (
    r.width > 1 &&
    r.height > 1 &&
    r.bottom > 0 &&
    r.right > 0 &&
    r.top < innerHeight &&
    r.left < innerWidth
  );
}

/**
 * Looping muted clip that does not attach src until it is on screen.
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

    const check = () => setInView(onScreen(el));
    const scroller = el.closest<HTMLElement>(
      ".project-hscroll, [data-project-scroll]",
    );

    check();
    scroller?.addEventListener("scroll", check, { passive: true });
    window.addEventListener("scroll", check, { passive: true });
    const io = new IntersectionObserver(() => {
      check();
    }, { root: null, rootMargin: "40px", threshold: 0 });
    io.observe(el);

    return () => {
      io.disconnect();
      scroller?.removeEventListener("scroll", check);
      window.removeEventListener("scroll", check);
    };
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
