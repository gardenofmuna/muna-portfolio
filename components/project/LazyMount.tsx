"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** CSS min-height so the page can still scroll before media mounts. */
  minHeight?: number;
};

/** Keep heavy galleries out of the DOM until they approach the viewport. */
export function LazyMount({ children, minHeight = 240 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShow(true);
        io.disconnect();
      },
      { root: null, rootMargin: "160px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {show ? children : <div style={{ minHeight }} aria-hidden />}
    </div>
  );
}
