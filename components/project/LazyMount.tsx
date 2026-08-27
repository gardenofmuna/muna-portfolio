"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** CSS min-height so the page can still scroll before media mounts. */
  minHeight?: number;
  /**
   * Wait until the project pane has been scrolled before mounting.
   * Stops first-paint from mounting galleries that sit near the fold.
   */
  afterScroll?: boolean;
};

function scrollRoot(el: HTMLElement) {
  return el.closest<HTMLElement>("[data-project-scroll]");
}

function inViewport(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
}

/** Keep heavy galleries out of the DOM until they approach the viewport. */
export function LazyMount({
  children,
  minHeight = 240,
  afterScroll = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;

    const root = scrollRoot(el);
    let cancelled = false;

    const tryShow = () => {
      if (cancelled || !el.isConnected) return;
      if (afterScroll && root && root.scrollTop < 24) return;
      if (inViewport(el)) setShow(true);
    };

    root?.addEventListener("scroll", tryShow, { passive: true });
    window.addEventListener("scroll", tryShow, { passive: true });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (afterScroll && root && root.scrollTop < 24) return;
        setShow(true);
      },
      { root: null, rootMargin: "0px", threshold: 0 },
    );
    io.observe(el);
    tryShow();

    return () => {
      cancelled = true;
      io.disconnect();
      root?.removeEventListener("scroll", tryShow);
      window.removeEventListener("scroll", tryShow);
    };
  }, [afterScroll, show]);

  return (
    <div ref={ref}>
      {show ? children : <div style={{ minHeight }} aria-hidden />}
    </div>
  );
}
