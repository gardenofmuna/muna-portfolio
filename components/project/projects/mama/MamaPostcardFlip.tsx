"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAMA_POSTCARD_BACK,
  MAMA_POSTCARD_FRONT,
} from "@/data/projects";

const AUTOPLAY_MS = 3200;
const FLIP_MS = 900;
const FLIP_SIZES = "(max-width: 900px) 92vw, 330px";

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function setFlipAngle(wrap: HTMLElement, deg: number) {
  const shade = Math.abs(Math.cos((deg * Math.PI) / 180));
  wrap.style.setProperty("--mama-flip", `${deg}deg`);
  wrap.style.setProperty("--mama-shadow", shade.toFixed(4));
  wrap.style.setProperty("--mama-shadow-o", (shade ** 4).toFixed(4));
}

export function MamaPostcardFlip() {
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLButtonElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef(0);
  const flippedRef = useRef(false);
  const [flipped, setFlipped] = useState(false);

  const animateTo = useCallback(
    (next: boolean) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const from = angleRef.current;
      const to = next ? 180 : 0;
      window.cancelAnimationFrame(rafRef.current);
      if (reduceMotion || Math.abs(to - from) < 0.5) {
        angleRef.current = to;
        setFlipAngle(wrap, to);
        flippedRef.current = next;
        setFlipped(next);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / FLIP_MS);
        const value = from + (to - from) * easeOutCubic(t);
        angleRef.current = value;
        setFlipAngle(wrap, value);
        if (t < 1) {
          rafRef.current = window.requestAnimationFrame(tick);
          return;
        }
        flippedRef.current = next;
        setFlipped(next);
      };
      rafRef.current = window.requestAnimationFrame(tick);
    },
    [reduceMotion],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduceMotion) return;

    let paused = false;
    let visible = true;
    let timer = 0;
    const scrollRoot = wrap.closest<HTMLElement>("[data-project-scroll]");

    const arm = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (paused || !visible) return;
        animateTo(!flippedRef.current);
      }, AUTOPLAY_MS);
    };

    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    const onFocusOut = (event: FocusEvent) => {
      if (!wrap.contains(event.relatedTarget as Node | null)) resume();
    };

    wrap.addEventListener("pointerenter", pause);
    wrap.addEventListener("pointerleave", resume);
    wrap.addEventListener("focusin", pause);
    wrap.addEventListener("focusout", onFocusOut);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      },
      { root: scrollRoot, threshold: [0, 0.2, 0.5] },
    );
    io.observe(wrap);
    arm();

    return () => {
      window.clearInterval(timer);
      window.cancelAnimationFrame(rafRef.current);
      wrap.removeEventListener("pointerenter", pause);
      wrap.removeEventListener("pointerleave", resume);
      wrap.removeEventListener("focusin", pause);
      wrap.removeEventListener("focusout", onFocusOut);
      io.disconnect();
    };
  }, [animateTo, reduceMotion]);

  return (
    <button
      ref={wrapRef}
      type="button"
      className="project-mama-flip"
      data-flipped={flipped ? "" : undefined}
      aria-pressed={flipped}
      aria-label={flipped ? "Show postcard front" : "Show postcard back"}
      onClick={() => animateTo(!flippedRef.current)}
    >
      <span className="project-mama-flip__shadow" aria-hidden />
      <span className="project-mama-flip__scene">
        <span className="project-mama-flip__card">
          <span className="project-mama-flip__face project-mama-flip__face--front">
            <Image
              src={MAMA_POSTCARD_FRONT.src}
              alt={MAMA_POSTCARD_FRONT.alt}
              width={MAMA_POSTCARD_FRONT.width}
              height={MAMA_POSTCARD_FRONT.height}
              className="project-mama-flip__image"
              sizes={FLIP_SIZES}
              priority
            />
          </span>
          <span className="project-mama-flip__face project-mama-flip__face--back">
            <Image
              src={MAMA_POSTCARD_BACK.src}
              alt={MAMA_POSTCARD_BACK.alt}
              width={MAMA_POSTCARD_BACK.width}
              height={MAMA_POSTCARD_BACK.height}
              className="project-mama-flip__image"
              sizes={FLIP_SIZES}
            />
          </span>
        </span>
      </span>
    </button>
  );
}
