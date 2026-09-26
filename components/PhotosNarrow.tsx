"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { CircularNavWheel } from "@/components/CircularNavWheel";
import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { SiteWordmark } from "@/components/SiteWordmark";
import {
  SHOT_ON_FILM_START,
  SHOT_ON_FILM_STILLS,
} from "@/data/shot-on-film";
import { DESKTOP_LAYOUT_H, DESKTOP_LAYOUT_W } from "@/lib/desktop-stage";
import { NARROW_NZERIBE } from "@/lib/narrow-stage";
import {
  readStableLayoutSize,
  subscribeStableLayout,
} from "@/lib/stable-viewport";

import "./photos-narrow.css";

type Props = {
  visible: boolean;
  onNavigate: (label: string) => void;
  onOpenDesign: () => void;
};

/** Hamburger SVG viewBox — match project / installation chrome. */
const MENU_ASPECT = 107 / 74;
const MENU_HEIGHT_SCALE = 0.85;

/** Share of the reel's width / height the centred still may fill. */
const COLUMN_W_SHARE = 0.68;
const COLUMN_H_SHARE = 0.68;
/** Viewfinder corners sit this far outside the still. */
const FINDER_PAD = 7;
const FRAME_GAP = 18;
const NEIGHBOR_SCALE = 0.88;
const CAPTION_GAP = 10;
/** Frames mounted either side of the centred one. */
const WINDOW = 3;
const SWIPE_MIN_PX = 40;
const FLICK_MIN_PX = 14;
const FLICK_MIN_VELOCITY = 0.35;
const SLIDE_MS = 420;
const SLIDE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const CAPTION_LINES = Array.from(
  new Set(SHOT_ON_FILM_STILLS.flatMap((s) => [s.place, s.taken])),
);

const mod = (k: number, n: number) => ((k % n) + n) % n;

/**
 * Mobile / tablet photos page — vertical film reel with viewfinder corners
 * around the centred still and its place / date to the right.
 */
export function PhotosNarrow({ visible, onNavigate, onOpenDesign }: Props) {
  const { u } = useNarrowArtboardMetrics();
  const n = SHOT_ON_FILM_STILLS.length;
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewportH, setViewportH] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pos, setPos] = useState(SHOT_ON_FILM_START);
  const [dragDy, setDragDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reel, setReel] = useState({ w: 0, h: 0, gutter: 20 });
  const [captionW, setCaptionW] = useState(96);
  const reelRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startT: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const scale = u || 1;
  const nzeribeH = NARROW_NZERIBE.h * scale;
  const menuH = nzeribeH * MENU_HEIGHT_SCALE;
  const menuW = menuH * MENU_ASPECT;
  const navScale = viewportH > 0 ? viewportH / DESKTOP_LAYOUT_H : 0;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const read = () => setViewportH(readStableLayoutSize().height);
    read();
    return subscribeStableLayout(read);
  }, []);

  const [wasVisible, setWasVisible] = useState(visible);
  if (wasVisible !== visible) {
    setWasVisible(visible);
    if (!visible) {
      setMenuOpen(false);
      setPos(SHOT_ON_FILM_START);
      setDragDy(0);
      setDragging(false);
    }
  }

  useLayoutEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const read = () => {
      const rect = el.getBoundingClientRect();
      const gutter =
        parseFloat(getComputedStyle(el).getPropertyValue("--ph-gutter")) ||
        20;
      setReel({ w: rect.width, h: rect.height, gutter });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* The column leaves room for the widest caption so none collide. */
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    let cancelled = false;
    const read = () => {
      if (cancelled) return;
      const widest = Math.max(
        0,
        ...Array.from(el.children).map(
          (child) => (child as HTMLElement).offsetWidth,
        ),
      );
      if (widest > 0) setCaptionW(Math.ceil(widest));
    };
    read();
    void document.fonts?.ready.then(read);
    return () => {
      cancelled = true;
    };
  }, [reel.w]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const leavePhotos = useCallback(
    (label: string) => {
      closeMenu();
      if (label === "photos") return;
      onNavigate(label);
      if (label === "design") onOpenDesign();
    },
    [closeMenu, onNavigate, onOpenDesign],
  );

  const layout = useMemo(() => {
    const { w, h, gutter } = reel;
    const colW = Math.max(
      120,
      Math.min(
        w * COLUMN_W_SHARE,
        w - gutter * 2 - FINDER_PAD * 2 - captionW - CAPTION_GAP,
      ),
    );
    const maxH = Math.max(120, h * COLUMN_H_SHARE);
    const full = SHOT_ON_FILM_STILLS.map((s) => {
      const fit = Math.min(colW / s.width, maxH / s.height);
      return { w: s.width * fit, h: s.height * fit };
    });
    const centers: number[] = [];
    let cursor = 0;
    for (const box of full) {
      const hN = box.h * NEIGHBOR_SCALE;
      centers.push(cursor + hN / 2);
      cursor += hN + FRAME_GAP;
    }
    return {
      full,
      centers,
      cycle: cursor,
      axisX: gutter + FINDER_PAD + colW / 2,
    };
  }, [reel, captionW]);

  /** Centre of still `k` with every frame at neighbour size. */
  const baseCenter = (k: number) =>
    Math.floor(k / n) * layout.cycle + layout.centers[mod(k, n)]!;

  const activeSlot = mod(pos, n);
  const activeBox = layout.full[activeSlot]!;
  const activeStill = SHOT_ON_FILM_STILLS[activeSlot]!;
  const extra = activeBox.h * (1 - NEIGHBOR_SCALE);

  const step = useCallback(
    (delta: number) => {
      if (n <= 1 || delta === 0) return;
      setPos((p) => p + delta);
    },
    [n],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startT: performance.now(),
      moved: false,
    };
    suppressClickRef.current = false;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dy = event.clientY - drag.startY;
    /* Capture only once it's a drag, so a tap still reaches a frame. */
    if (!drag.moved && Math.abs(dy) > 6) {
      drag.moved = true;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* pointer already gone */
      }
    }
    if (drag.moved) setDragDy(dy);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    if (!drag.moved) return;
    suppressClickRef.current = true;
    const dy = event.clientY - drag.startY;
    const velocity = Math.abs(dy) / Math.max(1, performance.now() - drag.startT);
    const swiped =
      Math.abs(dy) > SWIPE_MIN_PX ||
      (Math.abs(dy) > FLICK_MIN_PX && velocity > FLICK_MIN_VELOCITY);
    if (swiped) {
      const unit = activeBox.h + FRAME_GAP;
      const count = Math.max(1, Math.round(Math.abs(dy) / unit));
      step(dy < 0 ? count : -count);
    }
    setDragging(false);
    setDragDy(0);
  };

  const slide = reduceMotion || dragging ? "none" : `${SLIDE_MS}ms ${SLIDE_EASE}`;
  const frameTransition =
    reduceMotion || dragging
      ? "none"
      : ["top", "left", "width", "height"]
          .map((prop) => `${prop} ${SLIDE_MS}ms ${SLIDE_EASE}`)
          .join(", ");
  const fadeMs = reduceMotion ? 80 : 420;
  const ready = reel.w > 0 && reel.h > 0;

  const frames: number[] = [];
  for (let k = pos - WINDOW; k <= pos + WINDOW; k++) frames.push(k);

  return (
    <div
      className="photos-narrow"
      data-visible={visible ? "" : undefined}
      data-menu-state={menuOpen ? "open" : "hidden"}
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      style={
        {
          "--ph-nzeribe-h": `${nzeribeH}px`,
          "--ph-menu-w": `${menuW}px`,
          "--ph-menu-h": `${menuH}px`,
          transition: reduceMotion
            ? "none"
            : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        } as CSSProperties
      }
    >
      <header className="photos-narrow__header">
        <SiteWordmark
          href="/"
          placement="flow"
          onClick={(event) => {
            event.preventDefault();
            leavePhotos("contact");
          }}
        />
        <button
          type="button"
          className="photos-narrow__menu-toggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 107 74" aria-hidden>
            <path
              fillRule="evenodd"
              fill="#000"
              d="M0.801,73.857 L0.801,62.195 L106.310,62.195 L106.310,73.857 L0.801,73.857 ZM0.801,31.098 L106.310,31.098 L106.310,42.759 L0.801,42.759 L0.801,31.098 ZM0.801,-0.000 L106.310,-0.000 L106.310,11.661 L0.801,11.661 L0.801,-0.000 Z"
            />
          </svg>
        </button>
      </header>

      <div
        ref={reelRef}
        className="photos-narrow__reel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Shot on film"
        tabIndex={visible ? 0 : -1}
        inert={menuOpen ? true : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
      >
        <div ref={measureRef} className="photos-narrow__caption-measure" aria-hidden>
          {CAPTION_LINES.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>

        {ready ? (
          <>
            <div
              className="photos-narrow__track"
              style={{
                transform: `translateY(${-baseCenter(pos) + dragDy}px)`,
                transition: slide === "none" ? "none" : `transform ${slide}`,
              }}
            >
              {frames.map((k) => {
                const slot = mod(k, n);
                const still = SHOT_ON_FILM_STILLS[slot]!;
                const box = layout.full[slot]!;
                const active = k === pos;
                const s = active ? 1 : NEIGHBOR_SCALE;
                const w = box.w * s;
                const h = box.h * s;
                const center =
                  baseCenter(k) + (k < pos ? -extra / 2 : k > pos ? extra / 2 : 0);
                return (
                  <button
                    key={k}
                    type="button"
                    className="photos-narrow__frame"
                    data-active={active ? "" : undefined}
                    tabIndex={-1}
                    aria-label={still.alt}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      if (suppressClickRef.current) {
                        suppressClickRef.current = false;
                        return;
                      }
                      if (!active) step(k - pos);
                    }}
                    style={{
                      width: w,
                      height: h,
                      top: center - h / 2,
                      left: layout.axisX - w / 2,
                      transition: frameTransition,
                    }}
                  >
                    <Image
                      src={still.src}
                      alt=""
                      width={still.width}
                      height={still.height}
                      draggable={false}
                      sizes="70vw"
                      className="photos-narrow__image"
                      unoptimized
                      loading="eager"
                      priority={active}
                    />
                  </button>
                );
              })}
            </div>

            <div
              className="photos-narrow__finder"
              aria-hidden
              style={{
                left: layout.axisX - activeBox.w / 2 - FINDER_PAD,
                width: activeBox.w + FINDER_PAD * 2,
                height: activeBox.h + FINDER_PAD * 2,
                marginTop: -(activeBox.h / 2 + FINDER_PAD),
                transition:
                  reduceMotion
                    ? "none"
                    : ["left", "width", "height", "margin-top"]
                        .map((prop) => `${prop} ${SLIDE_MS}ms ${SLIDE_EASE}`)
                        .join(", "),
              }}
            >
              <span className="photos-narrow__corner photos-narrow__corner--tl" />
              <span className="photos-narrow__corner photos-narrow__corner--tr" />
              <span className="photos-narrow__corner photos-narrow__corner--bl" />
              <span className="photos-narrow__corner photos-narrow__corner--br" />
            </div>

            <p
              key={`${activeStill.place}-${activeStill.taken}`}
              className="photos-narrow__caption"
              style={{ marginTop: -(activeBox.h / 2 + FINDER_PAD) }}
            >
              <span>{activeStill.place}</span>
              <span>{activeStill.taken}</span>
            </p>
          </>
        ) : null}
      </div>

      {menuOpen && navScale > 0 ? (
        <div
          className="photos-narrow__nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div
            className="photos-narrow__nav-stage"
            style={{
              width: DESKTOP_LAYOUT_W,
              height: DESKTOP_LAYOUT_H,
              transform: `scale(${navScale})`,
            }}
          >
            <CircularNavWheel
              layout="desktop"
              containment="stage"
              spinFeel="narrow"
              initialActiveLabel="photos"
              onLabelActivate={(label) => {
                if (label === "photos") {
                  closeMenu();
                  return;
                }
                if (label === "contact") {
                  leavePhotos("about");
                  return;
                }
                if (
                  label === "design" ||
                  label === "about" ||
                  label === "installation" ||
                  label === "cv + press"
                ) {
                  leavePhotos(label);
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
