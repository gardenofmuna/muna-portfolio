"use client";

import { useEffect, useRef, useState } from "react";

const SIZE = 24; /* match CursorDot */
const LERP = 0.2;

/**
 * Same cursor dot as main page, used when hovering dock buttons (system cursor hidden).
 * Rendered in the dock portal so it appears on top.
 */
export function DockCursor({ visible }: { visible: boolean }) {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!mounted || !elRef.current) return;

    const el = elRef.current;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const loop = () => {
      const { x: tx, y: ty } = target.current;
      let { x, y } = pos.current;
      x += (tx - x) * LERP;
      y += (ty - y) * LERP;
      pos.current = { x, y };
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      rafId.current = requestAnimationFrame(loop);
    };

    document.addEventListener("mousemove", onMove);
    rafId.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={elRef}
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: SIZE,
        height: SIZE,
        pointerEvents: "none",
        zIndex: 110,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
        backgroundImage: "url(/cursor-dot.png)",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "#6b2d2d",
        borderRadius: "50%",
        willChange: "transform",
      }}
    />
  );
}
