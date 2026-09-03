"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const PAUSE_FLASH_MS = 2200;

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  poster?: string;
  /** Cover-flow peeks stay unloaded until the card is centered. */
  active?: boolean;
  /** Centered play/pause overlay. Video starts paused. */
  togglePlayback?: boolean;
};

/** SVG Repo play-fill: solid triangle, colored white via currentColor. */
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon fill="currentColor" points="2.01,0.33 23.01,12 2.01,23.64" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8 3h2.2v18H8zM13.8 3H16v18h-2.2z" />
    </svg>
  );
}

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
  togglePlayback = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const allowPlay = useRef(false);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pauseFlash, setPauseFlash] = useState(false);
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
      allowPlay.current = false;
      el.pause();
      setPauseFlash(false);
      setPlaying(false);
      if (el.getAttribute("src")) {
        el.removeAttribute("src");
        el.load();
      }
      return;
    }

    el.autoplay = false;
    if (el.getAttribute("src") !== src) {
      el.src = src;
      el.load();
    }
    if (togglePlayback) {
      const keepPaused = () => {
        if (!allowPlay.current && !el.paused) {
          el.pause();
        }
      };
      const showFirstFrame = () => {
        if (allowPlay.current) return;
        keepPaused();
        try {
          if (el.currentTime < 0.05) el.currentTime = 0.001;
        } catch {
          /* Some browsers reject seeks before duration is known. */
        }
      };
      el.addEventListener("play", keepPaused);
      el.addEventListener("loadeddata", showFirstFrame);
      showFirstFrame();
      return () => {
        el.removeEventListener("play", keepPaused);
        el.removeEventListener("loadeddata", showFirstFrame);
      };
    }
    if (!reduceMotion) {
      void el.play().catch(() => {
        /* Autoplay can be blocked; clip stays muted for a later attempt. */
      });
    }
  }, [reduceMotion, shouldLoad, src, togglePlayback]);

  useEffect(() => {
    if (!pauseFlash) return;
    if (reduceMotion) {
      setPauseFlash(false);
      return;
    }
    const id = window.setTimeout(() => setPauseFlash(false), PAUSE_FLASH_MS);
    return () => window.clearTimeout(id);
  }, [pauseFlash, reduceMotion]);

  const overlay = pauseFlash ? "pause" : playing ? "hidden" : "play";

  const video = (
    <video
      ref={ref}
      className={className}
      width={width}
      height={height}
      autoPlay={false}
      muted
      loop
      playsInline
      preload={togglePlayback ? "auto" : "none"}
      poster={togglePlayback ? undefined : poster}
      aria-label={alt}
      onPlay={() => {
        if (!allowPlay.current) return;
        setPlaying(true);
        setPauseFlash(false);
      }}
      onPause={() => setPlaying(false)}
    />
  );

  if (!togglePlayback) {
    return video;
  }

  return (
    <div className="project-video-toggle-wrap">
      {video}
      <button
        type="button"
        className="project-video-toggle"
        data-overlay={overlay}
        aria-label={playing ? "Pause video" : "Play video"}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (el.paused) {
            allowPlay.current = true;
            void el.play().catch(() => {
              allowPlay.current = false;
            });
            return;
          }
          allowPlay.current = false;
          el.pause();
          if (!reduceMotion) setPauseFlash(true);
        }}
      >
        {overlay === "pause" ? <PauseIcon /> : <PlayIcon />}
      </button>
    </div>
  );
}
