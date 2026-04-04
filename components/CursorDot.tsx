"use client";

import { useEffect, useRef, useState } from "react";

const SPRING = 0.018;       /* pull toward target (float/orbit) */
const DAMPING = 0.88;      /* velocity decay = slight bounce */
const EDGE_BOUNCE = 0.62;  /* velocity retained when hitting screen edge */
const OFFSET_DISTANCE_PX = 50;  /* ball’s rest position: 50px from cursor at 45° */
const OFFSET_ANGLE_DEG = 45;
const MIN_DISTANCE_FROM_MOUSE_PX = 32;  /* ball never gets closer – no touch/overlap */
const HOVER_SCALE = 1.4;
const SIZE = 24;
/* Morph height = dot diameter; width comes from about-me.png aspect ratio (see aboutMorphWRef) */
const ABOUT_MORPH_SIZE_H = SIZE;
/* Prior speed; anti-freeze fixes are width/radius/min-distance/order below */
const MORPH_LERP = 0.22;
/* Smooth loaded about-me width so image onload doesn’t pop / stutter */
const ABOUT_W_LERP = 0.22;
/* Circle in SIZE box ≈ SIZE/2 radius; morphed strip uses smaller radius */
const RADIUS_CIRCLE_PX = SIZE / 2;
const RADIUS_MORPHED_PX = 6;

const ANGLE_RAD = (OFFSET_ANGLE_DEG * Math.PI) / 180;

/**
 * Cursor dot: rest position 50px from cursor at 45° (upper-right).
 * Floats with spring/bounce; never closer than MIN_DISTANCE so ball and cursor don’t touch.
 */
export function CursorDot() {
  const [mounted, setMounted] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const mouse = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const targetScaleRef = useRef(1);
  const morphRef = useRef(0);
  const targetMorphRef = useRef(0);
  const rafId = useRef<number>(0);
  /* Full width at 24px tall = no side crop (was fixed 52px + overflow:hidden) */
  const aboutMorphWRef = useRef(SIZE);
  const aboutWSmoothRef = useRef(SIZE);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalHeight > 0) {
        aboutMorphWRef.current = Math.ceil(
          SIZE * (img.naturalWidth / img.naturalHeight)
        );
      }
    };
    img.src = "/about-me.png";
  }, []);

  useEffect(() => {
    if (!mounted || !dotRef.current) return;

    const dot = dotRef.current;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      /* Target = cursor + 50px at 45° (upper-right); ball orbits this point */
      target.current.x = e.clientX + OFFSET_DISTANCE_PX * Math.cos(ANGLE_RAD);
      target.current.y = e.clientY - OFFSET_DISTANCE_PX * Math.sin(ANGLE_RAD);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const onArtistBio = !!el?.closest("[data-cursor-artist-bio]");
      targetMorphRef.current = onArtistBio ? 1 : 0;
      const interactive = el?.closest(
        "a, button, [role='button'], [data-cursor-hover]"
      );
      targetScaleRef.current =
        onArtistBio ? 1 : interactive ? HOVER_SCALE : 1;
    };

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const loop = () => {
      const { x: tx, y: ty } = target.current;
      let { x, y } = pos.current;
      let { x: vx, y: vy } = vel.current;
      let scale = scaleRef.current;
      const tScale = targetScaleRef.current;

      /* Spring force toward mouse → float around / orbit */
      vx += (tx - x) * SPRING;
      vy += (ty - y) * SPRING;

      pos.current.x = x + vx;
      pos.current.y = y + vy;
      x = pos.current.x;
      y = pos.current.y;

      /* Damping = slight bouncy movement */
      vx *= DAMPING;
      vy *= DAMPING;
      vel.current.x = vx;
      vel.current.y = vy;

      /* Bounce off edges and return to mouse orbit */
      if (x < 0) {
        pos.current.x = 0;
        vel.current.x = -vx * EDGE_BOUNCE;
      } else if (x > w) {
        pos.current.x = w;
        vel.current.x = -vx * EDGE_BOUNCE;
      }
      if (y < 0) {
        pos.current.y = 0;
        vel.current.y = -vy * EDGE_BOUNCE;
      } else if (y > h) {
        pos.current.y = h;
        vel.current.y = -vy * EDGE_BOUNCE;
      }

      scale += (tScale - scale) * 0.12;

      /* Morph first so min-distance + layout use same frame (less jitter) */
      let morph = morphRef.current;
      morph += (targetMorphRef.current - morph) * MORPH_LERP;
      morphRef.current = morph;

      let wTarget = aboutMorphWRef.current;
      let wSm = aboutWSmoothRef.current;
      wSm += (wTarget - wSm) * ABOUT_W_LERP;
      aboutWSmoothRef.current = wSm;

      /* Keep ball at least MIN_DISTANCE from cursor so they never touch */
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const dx = pos.current.x - mx;
      const dy = pos.current.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      /* Wider morphed cursor: ease orbit constraint (fights spring less) */
      const minFromMouse =
        MIN_DISTANCE_FROM_MOUSE_PX * (1 - 0.45 * morph);
      if (dist < minFromMouse) {
        const push = minFromMouse / dist;
        pos.current.x = mx + dx * push;
        pos.current.y = my + dy * push;
        /* Slight velocity nudge away so it doesn’t stick */
        const nx = dx / dist;
        const ny = dy / dist;
        const vToward = vel.current.x * nx + vel.current.y * ny;
        if (vToward < 0) {
          vel.current.x -= nx * vToward * 1.2;
          vel.current.y -= ny * vToward * 1.2;
        }
      }

      const cw = SIZE + (wSm - SIZE) * morph;
      const ch =
        SIZE + (ABOUT_MORPH_SIZE_H - SIZE) * morph;
      dot.style.width = `${cw}px`;
      dot.style.height = `${ch}px`;
      /* Interpolate corner radius (no snap at 0.45) */
      const r =
        RADIUS_CIRCLE_PX + (RADIUS_MORPHED_PX - RADIUS_CIRCLE_PX) * morph;
      dot.style.borderRadius = `${r}px`;

      const dotLayer = dot.firstElementChild as HTMLElement | null;
      const aboutLayer = dot.lastElementChild as HTMLElement | null;
      if (dotLayer && aboutLayer && dotLayer !== aboutLayer) {
        dotLayer.style.opacity = String(1 - morph);
        dotLayer.style.borderRadius = `${r}px`;
        aboutLayer.style.opacity = String(morph);
        aboutLayer.style.borderRadius = `${r}px`;
      }

      dot.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) scale(${scale})`;
      rafId.current = requestAnimationFrame(loop);
    };

    document.addEventListener("mousemove", onMove);
    rafId.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: SIZE,
        height: SIZE,
        pointerEvents: "none",
        zIndex: 99999,
        willChange: "transform, width, height",
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/cursor-dot.png)",
          /* Fill box height = circle diameter (24px); same vertical metric as about-me */
          backgroundSize: "auto 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundColor: "#6b2d2d",
          borderRadius: "50%",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          backgroundImage: "url(/about-me.png)",
          /* Match dot: scale by height so tag is exactly as tall as the dot circle */
          backgroundSize: "auto 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
}
