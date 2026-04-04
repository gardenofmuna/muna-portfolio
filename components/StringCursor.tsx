"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen canvas that draws a rope/string line following the cursor.
 * Based on khyatitrehan.com. Canvas has pointer-events: none so clicks pass through.
 */
export function StringCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    const resizeListener = () => setSize();
    window.addEventListener("resize", resizeListener);

    const points: { x: number; y: number }[] = [];
    let mouseX = 0;
    let mouseY = 0;

    const mouseListener = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    document.addEventListener("mousemove", mouseListener);

    points.push({ x: mouseX, y: mouseY });

    let rafId: number;
    const loop = () => {
      if (!canvasRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (
        points.length === 0 ||
        Math.abs(mouseX - points[0].x) > 5 ||
        Math.abs(mouseY - points[0].y) > 5
      ) {
        points.unshift({ x: mouseX, y: mouseY });
      }

      for (let i = 1; i < points.length; i++) {
        points[i].y += 0.5;

        if (points[i].y > canvas.height) {
          points[i].y = canvas.height;
        }

        const dx = points[i - 1].x - points[i].x;
        const dy = points[i - 1].y - points[i].y;
        points[i].x += dx * 0.1;

        if (points[i].y < canvas.height) {
          points[i].y += dy * 0.1;
        }
      }

      /* Biro-style: draw in short segments with uneven opacity and thickness */
      const segLen = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const steps = Math.max(1, Math.floor(dist / segLen));
        for (let s = 0; s < steps; s++) {
          const t0 = s / steps;
          const t1 = (s + 1) / steps;
          const x0 = a.x + (b.x - a.x) * t0;
          const y0 = a.y + (b.y - a.y) * t0;
          const x1 = a.x + (b.x - a.x) * t1;
          const y1 = a.y + (b.y - a.y) * t1;
          const segIndex = i * 4 + s;
          ctx.globalAlpha = 0.72 + 0.28 * (Math.sin(segIndex * 0.53) * 0.5 + 0.5);
          ctx.lineWidth = 1.1 + 0.8 * (Math.sin(segIndex * 0.31) * 0.5 + 0.5);
          ctx.strokeStyle = "#1a1a1a";
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", resizeListener);
      document.removeEventListener("mousemove", mouseListener);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
}
