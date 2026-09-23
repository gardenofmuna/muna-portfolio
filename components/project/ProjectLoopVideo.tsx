"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

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
  /** Bottom progress bar that can be dragged to seek. */
  scrubber?: boolean;
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
  scrubber = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const allowPlay = useRef(false);
  const scrubbing = useRef(false);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pauseFlash, setPauseFlash] = useState(false);
  const [progress, setProgress] = useState(0);
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

  useEffect(() => {
    if (!scrubber) return;
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      if (scrubbing.current) return;
      const d = el.duration;
      if (!Number.isFinite(d) || d <= 0) {
        setProgress(0);
        return;
      }
      setProgress(el.currentTime / d);
    };

    el.addEventListener("timeupdate", sync);
    el.addEventListener("loadedmetadata", sync);
    el.addEventListener("seeked", sync);
    sync();
    return () => {
      el.removeEventListener("timeupdate", sync);
      el.removeEventListener("loadedmetadata", sync);
      el.removeEventListener("seeked", sync);
    };
  }, [scrubber, shouldLoad, src]);

  const seekTo = (next: number) => {
    const el = ref.current;
    if (!el) return;
    const d = el.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    const t = Math.min(1, Math.max(0, next)) * d;
    try {
      el.currentTime = t;
    } catch {
      /* ignore */
    }
    setProgress(Math.min(1, Math.max(0, next)));
  };

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
      preload={togglePlayback || scrubber ? "auto" : "none"}
      poster={togglePlayback ? undefined : poster}
      aria-label={alt}
      onPlay={() => {
        if (!allowPlay.current && togglePlayback) return;
        setPlaying(true);
        setPauseFlash(false);
      }}
      onPause={() => setPlaying(false)}
    />
  );

  if (!togglePlayback && !scrubber) {
    return video;
  }

  return (
    <div
      className="project-video-toggle-wrap"
      data-scrubber={scrubber ? "" : undefined}
    >
      {video}
      {togglePlayback ? (
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
      ) : null}
      {scrubber ? (
        <div
          className="project-video-scrub"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <input
            type="range"
            className="project-video-scrub__range"
            min={0}
            max={1}
            step="any"
            value={progress}
            aria-label="Seek video"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            style={
              {
                ["--scrub-progress" as string]: `${progress * 100}%`,
              } as CSSProperties
            }
            onPointerDown={() => {
              scrubbing.current = true;
            }}
            onPointerUp={() => {
              scrubbing.current = false;
            }}
            onPointerCancel={() => {
              scrubbing.current = false;
            }}
            onChange={(event) => {
              seekTo(Number(event.currentTarget.value));
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
