"use client";

import { useEffect, useRef, useState } from "react";

const OFFSET_DISTANCE_PX = 30;
const OFFSET_ANGLE_DEG = 45;
const LERP = 0.2;
const SIZE = 28;

const ANGLE_RAD = (OFFSET_ANGLE_DEG * Math.PI) / 180;

/**
 * Paper-clip icon that follows the mouse at 30px, 45° (upper-right),
 * only visible when the dock is being interacted with (dock visible).
 */
export function DockPaperClip({ visible }: { visible: boolean }) {
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
      target.current.x = e.clientX + OFFSET_DISTANCE_PX * Math.cos(ANGLE_RAD);
      target.current.y = e.clientY - OFFSET_DISTANCE_PX * Math.sin(ANGLE_RAD);
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
        backgroundImage: "url(/paper-clip.png)",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        willChange: "transform",
      }}
    />
  );
}
