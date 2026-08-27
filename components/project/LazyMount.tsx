"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** CSS min-height so the page can still scroll before media mounts. */
  minHeight?: number;
  /**
   * Wait until the project pane has been scrolled before observing.
   * Stops first-paint from mounting galleries that sit near the fold.
   */
  afterScroll?: boolean;
};

function scrollRoot(el: HTMLElement) {
  return el.closest<HTMLElement>("[data-project-scroll]");
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
    if (!el) return;

    const root = scrollRoot(el);
    let io: IntersectionObserver | null = null;
    let cancelled = false;

    const observe = () => {
      if (cancelled || !el.isConnected) return;
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setShow(true);
          io?.disconnect();
        },
        { root, rootMargin: "0px", threshold: 0.01 },
      );
      io.observe(el);
    };

    if (afterScroll && root && root.scrollTop < 24) {
      const onScroll = () => {
        if (root.scrollTop < 24) return;
        root.removeEventListener("scroll", onScroll);
        observe();
      };
      root.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        cancelled = true;
        root.removeEventListener("scroll", onScroll);
        io?.disconnect();
      };
    }

    observe();
    return () => {
      cancelled = true;
      io?.disconnect();
    };
  }, [afterScroll]);

  return (
    <div ref={ref}>
      {show ? children : <div style={{ minHeight }} aria-hidden />}
    </div>
  );
}
