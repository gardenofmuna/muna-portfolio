"use client";

import {
  memo,
  startTransition,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { DesktopStageViewContext } from "@/components/DesktopStageCanvas";
import { readSafari } from "@/lib/safari";
import {
  CV_EMAIL,
  CV_NAME,
  CV_PDF,
  CV_SECTIONS,
  CV_SITE,
  type CvEntry,
  type CvSection,
} from "@/data/cv";

import "./cv-pane.css";

/*
 * Motion after the certificate on virgilabloh.com: the sheet arrives small,
 * rotated and rolled from its top-left corner, spins upright, scales up and
 * uncurls; each value eases toward its target with the same per-frame rates
 * (at 60fps — scaled by frame time so 120Hz screens move the same).
 */
const ENTRY_MS = 1400;
const START_ROTATION = -45;
const START_ROTATION_AT = 0.16;
const SCALE_BASE = 0.41;
const SCALE_TARGET_AT = 0.22;
const START_OFFSET_Y = 520;
const EASE_SCALE = 0.12;
const EASE_Y = 0.12;
const EASE_ROTATION = 0.18;
const EASE_CURL = 0.2;
const EASE_FLEX = 0.14;
const FLEX_DECAY = 0.86;
const FRAME_MS = 1000 / 60;
const SHADOW_OFFSET = 12;
const SHADOW_OPACITY = 0.56;

/* The sheet trails the scroll a little and settles into place, like the
   archive’s lerped scroll. */
const EASE_TRAIL = 0.14;
const TRAIL_MAX = 180;
const TRAIL_OFFSET = 0.3;

/*
 * Wind at the bottom: scrolling past the end builds a pull that the sheet
 * resists (it saturates), and that pull becomes wind lifting the bottom of
 * the page. The bottom is a chain of thin hinged strips (see `.cv-strip`)
 * following one smooth curve — bending from nothing at the top, more toward
 * the free edge — with waves rolling down it, so it billows without creases.
 */
const WIND_STRIPS = 16;
const PULL_RESISTANCE = 700;
const PULL_MAX = 4000;
const RELEASE_MS = 160;
const RELEASE_DECAY = 0.9;
const EASE_WIND = 0.06;
const WIND_LIFT = 22;
/* Total bend (degrees) across the strips from each part of the curve. */
const BILLOW = 42;
const WAVE = 40;
const WAVE_FAST = 18;
const WAVE_HZ = 0.8;
const WAVE_LENGTH = 1.25;
const STRIP_STIFFNESS = 0.08;
const STRIP_DAMPING = 0.2;
const STRIP_SHADE_AT = 90;

type PaperState = {
  scale: number;
  y: number;
  rotation: number;
  curl: number;
  flex: number;
};

function entryTargets(t: number): Omit<PaperState, "flex"> {
  /* `t` walks 0 → 1 over the entry; the archive’s scroll curve spends its
     first 22% arriving, so remap the entry onto that stretch. */
  const p = t * SCALE_TARGET_AT;
  const arrived = Math.min(1, p / SCALE_TARGET_AT);
  return {
    scale: SCALE_BASE + (1 - SCALE_BASE) * arrived,
    y: START_OFFSET_Y * (1 - arrived),
    rotation:
      p <= START_ROTATION_AT ? START_ROTATION * (1 - p / START_ROTATION_AT) : 0,
    curl: 1 - arrived,
  };
}

function isSettled(s: PaperState) {
  return (
    Math.abs(1 - s.scale) < 0.0005 &&
    Math.abs(s.y) < 0.2 &&
    Math.abs(s.rotation) < 0.01 &&
    s.curl < 0.0005 &&
    Math.abs(s.flex) < 0.01
  );
}

/** Per-frame ease rate `k` (tuned at 60fps) adjusted for the real frame time. */
function ease(k: number, dt: number) {
  return 1 - Math.pow(1 - k, dt / FRAME_MS);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/* Matches the pane's smart-object scale (ProjectContentPane SMART_EASE). */
const PANE_MS = 280;

/** CSS `cubic-bezier(0.22, 1, 0.36, 1)` at time fraction `t`. */
function paneEase(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const bez = (s: number, a: number, b: number) =>
    3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, 0.22, 0.36) < t) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, 1, 1);
}

/*
 * Only `transform` and `opacity` are written per frame, on layers promoted
 * while moving, so the browser never re-lays out or repaints the CV text.
 * The loop sleeps once the sheet is flat and wakes on scroll or wheel.
 *
 * When floating, the visible sheet lives in the stage’s top layer and the
 * pane holds an invisible anchor (the real, clickable CV); every frame the
 * sheet is pinned over the anchor, so the pane still scrolls natively while
 * the paper can move over the whole site.
 */
function usePaperMotion(
  floating: boolean,
  windReady: boolean,
  onWindWanted: () => void,
) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const windRef = useRef({ ready: windReady, want: onWindWanted });
  useLayoutEffect(() => {
    windRef.current = { ready: windReady, want: onWindWanted };
  });

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const anchor = floating ? anchorRef.current : null;
    const float = floating ? floatRef.current : null;
    if (!sheet || (floating && (!anchor || !float))) return undefined;
    const mover = sheet.querySelector<HTMLElement>(".cv-sheet__mover");
    const shadow = sheet.querySelector<HTMLElement>(".cv-sheet__shadow");
    const sheen = sheet.querySelector<HTMLElement>(".cv-pane__sheen");
    const strips = Array.from(sheet.querySelectorAll<HTMLElement>(".cv-strip"));
    const shades = Array.from(
      sheet.querySelectorAll<HTMLElement>(".cv-strip__shade"),
    );
    if (!mover || !shadow || !sheen || strips.length !== WIND_STRIPS) {
      return undefined;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Safari drops CSS transitions that share a frame with layout, and a
       perspective tilt on this sheet steps, then snaps flat. Keep it flat
       and ease the visible layer on the compositor instead. */
    const safari = readSafari();

    const frame = anchor ?? sheet;
    const scroller = frame.closest<HTMLElement>("[data-project-scroll]");

    let floatWidth = -1;
    let placedScroll = Number.NaN;
    let shownX = Number.NaN;
    let shownY = Number.NaN;
    /* When the dial opens or closes, the pane column moves in one frame
       while its scale eases. The sheet keeps its old position as an offset
       that shrinks with the scale's own progress (not a clock — the scale
       starts a frame or more after the commit), so it glides instead of
       jumping and its far edge holds still. */
    let carry: {
      x: number;
      y: number;
      start: number;
      from: number;
      to: number;
    } | null = null;
    const carryProgress = (scale: number, now: number) => {
      if (!carry) return 1;
      if (now - carry.start > PANE_MS * 4) return 1;
      if (Math.abs(carry.from - carry.to) > 0.001) {
        return clamp((carry.from - scale) / (carry.from - carry.to), 0, 1);
      }
      return paneEase((now - carry.start) / PANE_MS);
    };
    /* In the same units as `rect.width / offsetWidth`: screen px over layout
       px, so the stage's own scale is folded in. */
    const paneTargetScale = () => {
      const inner = anchor?.closest<HTMLElement>(".project-pane__inner");
      const match = inner?.style.transform.match(/scale\(([\d.]+)\)/);
      const stage = scroller
        ? scroller.getBoundingClientRect().width / (scroller.offsetWidth || 1) || 1
        : 1;
      return (match ? Number(match[1]) : 1) * stage;
    };
    const place = () => {
      if (!anchor || !float) return;
      const host = float.parentElement?.getBoundingClientRect();
      const rect = anchor.getBoundingClientRect();
      const width = anchor.offsetWidth;
      if (width !== floatWidth) {
        float.style.width = `${width}px`;
        floatWidth = width;
      }
      const scale = rect.width / (width || 1) || 1;
      const dpr = window.devicePixelRatio || 1;
      let left = rect.left - (host?.left ?? 0);
      let top = rect.top - (host?.top ?? 0);
      if (carry) {
        const k = 1 - carryProgress(scale, performance.now());
        if (k <= 0.0005) carry = null;
        else {
          left += carry.x * k;
          top += carry.y * k;
        }
      }
      const x = Math.round(left * dpr) / dpr;
      const y = Math.round(top * dpr) / dpr;
      shownX = x;
      shownY = y;
      float.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale.toFixed(5)})`;
      placedScroll = scroller?.scrollTop ?? 0;
      if (safari) rememberPose(scroller?.scrollTop ?? 0, x, y, scale);
    };

    let pinning = false;
    let pinAnim: Animation | null = null;
    let pose: {
      scrollTop: number;
      x: number;
      y: number;
      scale: number;
      py: number;
    } | null = null;
    const rememberPose = (
      scrollTop: number,
      x: number,
      y: number,
      scale: number,
    ) => {
      if (!scroller) return;
      const view = scroller.getBoundingClientRect().height;
      pose = {
        scrollTop,
        x,
        y,
        scale,
        py: view / (scroller.clientHeight || 1),
      };
    };
    /* Scroll only moves the sheet — no layout read, so Safari can stay on
       the compositor between frames. */
    const placeFast = (scrollTop: number) => {
      if (!float || !pose) {
        place();
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const y =
        Math.round((pose.y - (scrollTop - pose.scrollTop) * pose.py) * dpr) /
        dpr;
      float.style.transform = `translate3d(${pose.x}px, ${y}px, 0) scale(${pose.scale.toFixed(5)})`;
    };

    /* Pivot around the middle of what is on screen, not the sheet’s centre.
       Measured when motion starts, then advanced by scroll alone. */
    let pivotBase = 420;
    let pivotScroll = 0;
    let pivotPerScroll = 1;
    const measurePivot = () => {
      if (!scroller) return;
      const frameRect = frame.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      const sheetScale = frameRect.width / (frame.offsetWidth || 1) || 1;
      const stageScale = scrollRect.width / (scroller.offsetWidth || 1) || 1;
      pivotBase =
        (scrollRect.top + scrollRect.height / 2 - frameRect.top) / sheetScale;
      pivotScroll = scroller.scrollTop;
      pivotPerScroll = stageScale / sheetScale;
    };
    const pivotY = (scrollTop: number) =>
      pivotBase + (scrollTop - pivotScroll) * pivotPerScroll;

    /* The pane eases its scale when the menu opens or closes. */
    const paneBusy = () =>
      !!scroller?.querySelector(".project-pane__inner[data-scaling]");

    const state: PaperState = reduced
      ? { scale: 1, y: 0, rotation: 0, curl: 0, flex: 0 }
      : { ...entryTargets(0), flex: 0 };
    let start = performance.now();
    /* The frame that mounts the page is long (first layout and paint). The
       entry clock starts on the first painted frame so it doesn't open with
       a skip. */
    let firstFrame = true;
    let flexTarget = 0;
    let lastScrollTop = scroller?.scrollTop ?? 0;
    let trail = lastScrollTop;
    let lastFrame = start;
    let raf = 0;
    let running = false;
    let entryDone = reduced;

    let pull = 0;
    let lastPush = 0;
    let wind = 0;
    let gustTime = 0;
    const angles = new Array<number>(WIND_STRIPS).fill(0);
    const velocities = new Array<number>(WIND_STRIPS).fill(0);

    const render = (scrollTop: number) => {
      const curl = state.curl + Math.min(0.35, Math.abs(state.flex) * 0.03);
      const lag = clamp(scrollTop - trail, -TRAIL_MAX, TRAIL_MAX);
      const y = state.y + lag * TRAIL_OFFSET - wind * WIND_LIFT;
      const swayY = wind * 3 * Math.sin(2 * Math.PI * 0.55 * gustTime + 0.4);
      const swayZ = wind * 0.6 * Math.sin(2 * Math.PI * 0.4 * gustTime);

      const origin = `50% ${pivotY(scrollTop).toFixed(1)}px`;
      const transform =
        `perspective(1800px) translate3d(0, ${y.toFixed(2)}px, 0) ` +
        `rotateZ(${(state.rotation + swayZ).toFixed(3)}deg) ` +
        `rotateX(${(curl * 24 + state.flex + wind * 2).toFixed(3)}deg) ` +
        `rotateY(${(curl * -32 + swayY).toFixed(3)}deg) ` +
        `scale(${state.scale.toFixed(4)})`;
      mover.style.transformOrigin = origin;
      mover.style.transform = transform;
      shadow.style.transformOrigin = origin;
      shadow.style.transform = `translate3d(0, ${(SHADOW_OFFSET + 40 * curl).toFixed(2)}px, 0) ${transform}`;
      shadow.style.opacity = (SHADOW_OPACITY + (1 - SHADOW_OPACITY) * curl).toFixed(3);
      sheen.style.opacity = curl.toFixed(3);

      if (!sheet.hasAttribute("data-wind")) return;
      let bend = 0;
      strips.forEach((strip, i) => {
        const angle = angles[i];
        strip.style.transform =
          i === 0
            ? `perspective(1400px) rotateX(${angle.toFixed(3)}deg)`
            : `rotateX(${angle.toFixed(3)}deg)`;
        const tilt = Math.abs(bend + angle / 2);
        shades[i]?.style.setProperty(
          "opacity",
          clamp(tilt / STRIP_SHADE_AT, 0, 1).toFixed(3),
        );
        bend += angle;
      });
    };

    /* A resting 3D transform softens text, so a flat sheet carries none. */
    const rest = () => {
      for (const el of [mover, shadow, ...strips]) {
        el.style.removeProperty("transform");
        el.style.removeProperty("transform-origin");
      }
      for (const el of [shadow, sheen, ...shades]) {
        el.style.removeProperty("opacity");
      }
      sheet.removeAttribute("data-wind");
      sheet.removeAttribute("data-moving");
      float?.removeAttribute("data-moving");
      /* Dropping the 3D layer and measuring layout in the same turn is the
         hitch at the end of the arrival. The float is already pinned. */
      if (!pinning && !(safari && placedScroll === (scroller?.scrollTop ?? 0))) {
        place();
      }
    };

    const stepWind = (now: number, dt: number) => {
      const steps = dt / FRAME_MS;
      if (now - lastPush > RELEASE_MS) {
        pull *= Math.pow(RELEASE_DECAY, steps);
        if (pull < 1) pull = 0;
      }
      const windTarget = 1 - Math.exp(-pull / PULL_RESISTANCE);
      wind += (windTarget - wind) * ease(EASE_WIND, dt);
      if (wind < 0.0005 && windTarget === 0) wind = 0;
      gustTime += dt / 1000;

      /* Sprung in sub-frame steps so dropped frames cannot overshoot. */
      const substeps = Math.ceil(steps);
      const h = steps / substeps;
      const phase = 2 * Math.PI * WAVE_HZ * gustTime;
      const k = (2 * Math.PI) / WAVE_LENGTH;
      for (let i = 0; i < WIND_STRIPS; i++) {
        /* `s` runs 0 → 1 down the wind region; bending grows with it so the
           join with the flat page above stays smooth. */
        const s = (i + 0.5) / WIND_STRIPS;
        const curve =
          BILLOW +
          WAVE * Math.sin(phase - k * s) +
          WAVE_FAST * Math.sin(1.63 * phase - 1.4 * k * s + 1.3);
        const target = (wind * 2 * s * curve) / WIND_STRIPS;
        for (let n = 0; n < substeps; n++) {
          const accel =
            (target - angles[i]) * STRIP_STIFFNESS -
            velocities[i] * STRIP_DAMPING;
          velocities[i] += accel * h;
          angles[i] += velocities[i] * h;
        }
      }
    };

    const windSettled = () =>
      pull === 0 &&
      wind === 0 &&
      angles.every((a, i) => Math.abs(a) < 0.02 && Math.abs(velocities[i]) < 0.02);

    const tick = (now: number) => {
      if (firstFrame) {
        firstFrame = false;
        start = now - FRAME_MS;
        lastFrame = now - FRAME_MS;
      }
      const dt = clamp(now - lastFrame, 1, 64);
      lastFrame = now;

      const scrollTop = scroller?.scrollTop ?? 0;
      const t = reduced ? 1 : clamp((now - start) / ENTRY_MS, 0, 1);
      const winding = sheet.hasAttribute("data-wind");
      const flat =
        safari &&
        !winding &&
        !pinning &&
        (reduced ||
          (t >= 1 && isSettled(state) && Math.abs(state.flex) < 0.02));
      if (flat) entryDone = true;
      if (pinning) {
        /* The dial ease owns the sheet transform until it finishes. */
      } else if (flat) {
        placeFast(scrollTop);
      } else if (safari && placedScroll === scrollTop) {
        /* Arrival curl only writes transforms. Measuring the anchor here
           forces Safari to lay out the sheet on every frame of the curl. */
      } else {
        place();
      }

      const menuScaling = paneBusy();
      if (reduced || flat) {
        trail = scrollTop;
        flexTarget = 0;
        state.flex = 0;
      } else {
        const target = entryTargets(1 - Math.pow(1 - t, 2));
        /* While the dial is returning, the pane scale is the motion.
           Extra scroll lag here reads as a jump. */
        if (menuScaling || safari) {
          flexTarget = 0;
          state.flex = 0;
          trail = scrollTop;
        } else {
          const velocity = ((scrollTop - lastScrollTop) * FRAME_MS) / dt;
          flexTarget = clamp(flexTarget + velocity * 0.08, -6, 6);
        }
        flexTarget *= Math.pow(FLEX_DECAY, dt / FRAME_MS);

        state.scale += (target.scale - state.scale) * ease(EASE_SCALE, dt);
        state.y += (target.y - state.y) * ease(EASE_Y, dt);
        state.rotation += (target.rotation - state.rotation) * ease(EASE_ROTATION, dt);
        state.curl += (target.curl - state.curl) * ease(EASE_CURL, dt);
        state.flex += (flexTarget - state.flex) * ease(EASE_FLEX, dt);
        if (!menuScaling) {
          trail += (scrollTop - trail) * ease(EASE_TRAIL, dt);
        }
        stepWind(now, dt);
      }
      lastScrollTop = scrollTop;

      if (
        t >= 1 &&
        !menuScaling &&
        carry === null &&
        Math.abs(flexTarget) < 0.01 &&
        Math.abs(scrollTop - trail) < 0.3 &&
        isSettled(state) &&
        windSettled()
      ) {
        state.flex = 0;
        flexTarget = 0;
        trail = scrollTop;
        angles.fill(0);
        velocities.fill(0);
        running = false;
        rest();
        return;
      }
      if (!reduced && !flat) render(scrollTop);
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (running) return;
      running = true;
      measurePivot();
      lastFrame = performance.now();
      lastScrollTop = scroller?.scrollTop ?? 0;
      if (!reduced) {
        sheet.setAttribute("data-moving", "");
        float?.setAttribute("data-moving", "");
      }
      raf = requestAnimationFrame(tick);
    };

    measurePivot();
    place();
    if (!reduced) render(lastScrollTop);
    wake();

    const onScroll = () => {
      if (pinning) return;
      if (safari && entryDone && !sheet.hasAttribute("data-wind")) {
        placeFast(scroller?.scrollTop ?? 0);
        return;
      }
      if (!running) wake();
    };

    const isPaneScale = (event: TransitionEvent) =>
      event.propertyName === "transform" &&
      event.target instanceof HTMLElement &&
      event.target.classList.contains("project-pane__inner");
    const onTransitionRun = (event: TransitionEvent) => {
      if (!isPaneScale(event)) return;
      wake();
    };

    const resizeObserver = anchor ? new ResizeObserver(() => wake()) : null;
    if (anchor) resizeObserver?.observe(anchor);

    const onWheel = (event: WheelEvent) => {
      if (!scroller || reduced) return;
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
      const atBottom =
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
      if (atBottom && dy > 0) {
        if (!windRef.current.ready) {
          windRef.current.want();
          return;
        }
        pull = Math.min(PULL_MAX, pull + dy);
        lastPush = performance.now();
        sheet.setAttribute("data-wind", "");
      } else if (dy < 0 && pull > 0) {
        pull = Math.max(0, pull + dy * 2);
      } else {
        return;
      }
      wake();
    };

    const onGeometry = () => {
      const scrollTop = scroller?.scrollTop ?? 0;
      trail = scrollTop;
      flexTarget = 0;
      state.flex = 0;
      lastScrollTop = scrollTop;
      if (!(safari && float && anchor)) {
        const fromX = shownX;
        const fromY = shownY;
        carry = null;
        place();
        const dx = fromX - shownX;
        const dy = fromY - shownY;
        if (
          !reduced &&
          Number.isFinite(dx) &&
          Number.isFinite(dy) &&
          (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)
        ) {
          const rect = anchor?.getBoundingClientRect();
          const width = anchor?.offsetWidth || 1;
          carry = {
            x: dx,
            y: dy,
            start: performance.now(),
            from: rect ? rect.width / width || 1 : 1,
            to: paneTargetScale(),
          };
          place();
        }
        if (!reduced) render(scrollTop);
        if (!running) wake();
        return;
      }
      const cur = float.getBoundingClientRect();
      const host = float.parentElement?.getBoundingClientRect();
      const rect = anchor.getBoundingClientRect();
      const widthChanged = Math.abs(cur.width - rect.width) > 1.5;
      const dpr = window.devicePixelRatio || 1;
      const x = Math.round((rect.left - (host?.left ?? 0)) * dpr) / dpr;
      const y = Math.round((rect.top - (host?.top ?? 0)) * dpr) / dpr;
      /* Keep the current layout width for the ease. Updating it first would
         pop the sheet, because the old scale would apply to the new width. */
      const layoutWidth =
        floatWidth > 0 ? floatWidth : float.offsetWidth || anchor.offsetWidth;
      const scale = rect.width / (layoutWidth || 1) || 1;
      const to = `translate3d(${x}px, ${y}px, 0) scale(${scale.toFixed(5)})`;
      const fromT = float.style.transform || "translate3d(0px, 0px, 0) scale(1)";
      pinAnim?.cancel();
      pinning = false;
      if (!widthChanged || reduced) {
        place();
        if (!reduced && sheet.hasAttribute("data-wind")) render(scrollTop);
        return;
      }
      float.style.transform = to;
      pinning = true;
      const anim = float.animate(
        [{ transform: fromT }, { transform: to }],
        {
          duration: 280,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
      pinAnim = anim;
      anim.onfinish = () => {
        anim.cancel();
        pinning = false;
        pinAnim = null;
        pose = null;
        place();
      };
    };
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    scroller?.addEventListener("panegeometry", onGeometry);
    scroller?.addEventListener("wheel", onWheel, { passive: true });
    scroller?.addEventListener("transitionrun", onTransitionRun);
    const onResize = () => {
      pose = null;
      placedScroll = Number.NaN;
      wake();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      pinAnim?.cancel();
      pinning = false;
      scroller?.removeEventListener("scroll", onScroll);
      scroller?.removeEventListener("panegeometry", onGeometry);
      scroller?.removeEventListener("wheel", onWheel);
      scroller?.removeEventListener("transitionrun", onTransitionRun);
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
      rest();
    };
  }, [floating]);

  return { sheetRef, anchorRef, floatRef };
}

function downloadCv() {
  window.open(CV_PDF.href, "_blank", "noopener");
  const link = document.createElement("a");
  link.href = CV_PDF.href;
  link.download = CV_PDF.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/*
 * Over the paper (but not its links) a "download cv" pill follows the
 * pointer; a click there downloads the PDF and opens it in a new tab.
 * Mouse only — on touch a tap is how you scroll and follow links. Written
 * straight to the DOM so moving the pointer never re-renders the CV.
 */
function useDownloadPill(
  targetRef: RefObject<HTMLElement | null>,
  pillRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const target = targetRef.current;
    const pill = pillRef.current;
    if (!enabled || !target || !pill) return undefined;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return undefined;
    }
    const scroller = target.closest<HTMLElement>("[data-project-scroll]");
    const overLink = (el: EventTarget | null) =>
      el instanceof Element && el.closest("a") !== null;
    let last: { x: number; y: number } | null = null;

    const hide = () => pill.removeAttribute("data-shown");
    const show = (x: number, y: number, over: EventTarget | null) => {
      last = { x, y };
      if (overLink(over)) {
        hide();
        return;
      }
      const host = pill.parentElement?.getBoundingClientRect();
      pill.style.transform = `translate3d(${x - (host?.left ?? 0)}px, ${y - (host?.top ?? 0)}px, 0)`;
      pill.setAttribute("data-shown", "");
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      show(event.clientX, event.clientY, event.target);
    };
    const onLeave = () => {
      last = null;
      hide();
    };
    /* Scrolling moves the page under a still pointer — it may now be on a link. */
    const onScroll = () => {
      if (!last) return;
      const under = document.elementFromPoint(last.x, last.y);
      if (under && target.contains(under)) show(last.x, last.y, under);
      else onLeave();
    };
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || overLink(event.target)) return;
      downloadCv();
    };

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerleave", onLeave);
    target.addEventListener("click", onClick);
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerleave", onLeave);
      target.removeEventListener("click", onClick);
      scroller?.removeEventListener("scroll", onScroll);
      hide();
    };
  }, [targetRef, pillRef, enabled]);
}

/** Paper colours, in the order successive openings of the CV use them. */
export const CV_TONES = [
  "pink",
  "yellow",
  "green",
  "orange",
  "purple",
  "blue",
] as const;
export type CvTone = (typeof CV_TONES)[number];

/** CV text for the desktop middle quadrant — sits inside `ProjectContentPane`. */
export function CvPane({ tone = "pink" }: { tone?: CvTone }) {
  /* On the desktop stage the paper floats in the top layer, over everything. */
  const { chromeEl } = useContext(DesktopStageViewContext);
  const floating = chromeEl != null;
  /* The wind bands hold 16 more copies of the CV. Built one per frame after
     the sheet has landed, so the arrival's first frame only builds the page. */
  const [windPages, setWindPages] = useState(0);
  const windReady = windPages >= WIND_STRIPS;
  useEffect(() => {
    if (windReady) return undefined;
    let raf = 0;
    const timer = window.setTimeout(
      () => {
        raf = requestAnimationFrame(() => {
          startTransition(() => setWindPages((n) => Math.min(WIND_STRIPS, n + 1)));
        });
      },
      windPages === 0 ? ENTRY_MS + 200 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [windPages, windReady]);
  const { sheetRef, anchorRef, floatRef } = usePaperMotion(floating, windReady, () =>
    setWindPages(WIND_STRIPS),
  );
  const pillRef = useRef<HTMLDivElement>(null);
  useDownloadPill(anchorRef, pillRef, floating);

  const sheet = (
    <div ref={sheetRef} className="cv-sheet" data-tone={tone}>
      <div className="cv-sheet__shadow" aria-hidden>
        <div className="cv-sheet__shadow-blur" />
      </div>
      <div className="cv-sheet__mover">
        <article
          className="cv-pane"
          aria-label={floating ? undefined : "CV"}
          aria-hidden={floating || undefined}
        >
          <span className="cv-pane__sheen" aria-hidden />
          <span className="cv-pane__dogear" aria-hidden />
          <CvContent copy={floating} />
        </article>
        <CvStrip index={0} pages={windPages} />
      </div>
    </div>
  );

  if (!chromeEl) return sheet;

  return (
    <>
      <div ref={anchorRef} className="cv-anchor">
        <article className="cv-pane cv-pane--anchor" aria-label="CV">
          <a className="cv-pane__download" href={CV_PDF.href} download={CV_PDF.filename}>
            Download CV (PDF)
          </a>
          <CvContent />
        </article>
      </div>
      {createPortal(
        <>
          <div ref={floatRef} className="cv-float" aria-hidden>
            {sheet}
          </div>
          <div ref={pillRef} className="cv-download-pill" aria-hidden>
            <span className="cv-download-pill__label">download cv</span>
          </div>
        </>,
        chromeEl,
      )}
    </>
  );
}

/* One band of the sheet’s bottom, hinged on the band above it: a window
   onto a copy of the CV lined up with the page, with the next band nested
   inside. Hidden unless the wind is blowing. */
const CvStrip = memo(function CvStrip({
  index,
  pages,
}: {
  index: number;
  pages: number;
}) {
  return (
    <div className="cv-strip" style={{ "--i": index } as CSSProperties} aria-hidden>
      <div className="cv-strip__face">
        <div className="cv-pane cv-strip__page">
          {index < pages ? <CvContent copy /> : null}
        </div>
        <span className="cv-strip__shade" />
      </div>
      {index + 1 < WIND_STRIPS ? <CvStrip index={index + 1} pages={pages} /> : null}
    </div>
  );
});

/* Static text, rendered up to 18 times (page, anchor, wind bands). Memoized
   so a menu or scroll state change above doesn't rebuild every copy. */
export const CvContent = memo(function CvContent({ copy = false }: { copy?: boolean }) {
  const tabIndex = copy ? -1 : undefined;
  return (
    <>
      <header className="cv-pane__header">
        <h1 className="project-header__title">{CV_NAME}</h1>
        <p className="cv-pane__contact project-body-copy">
          <a href={`mailto:${CV_EMAIL}`} tabIndex={tabIndex}>
            {CV_EMAIL}
          </a>
          <span aria-hidden> | </span>
          <a href={CV_SITE.href} target="_blank" rel="noreferrer" tabIndex={tabIndex}>
            {CV_SITE.label}
          </a>
        </p>
      </header>

      <div className="cv-pane__columns">
        {(["left", "right"] as const).map((column) => (
          <div key={column} className="cv-pane__column">
            {CV_SECTIONS.filter((s) => s.column === column).map((section) => (
              <CvSectionBlock key={section.id} section={section} copy={copy} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
});

function CvSectionBlock({ section, copy }: { section: CvSection; copy: boolean }) {
  return (
    <section className="cv-pane__section" id={copy ? undefined : `cv-${section.id}`}>
      <h2 className="cv-pane__heading">{section.heading}</h2>
      {section.entries ? (
        <ul className="cv-pane__entries">
          {section.entries.map((entry) => (
            <CvRow key={`${entry.dates}-${entry.title}`} entry={entry} copy={copy} />
          ))}
        </ul>
      ) : null}
      {section.list ? (
        <ul className="cv-pane__list project-body-copy">
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CvRow({ entry, copy }: { entry: CvEntry; copy: boolean }) {
  return (
    <li className="cv-pane__entry">
      <p className="cv-pane__dates project-body-copy">
        {entry.dates}
        {entry.dates && entry.datesItalic ? " " : null}
        {entry.datesItalic ? <em>{entry.datesItalic}</em> : null}
      </p>
      <div className="cv-pane__body">
        <p className="cv-pane__title">
          {entry.href ? (
            <a
              href={entry.href}
              target="_blank"
              rel="noreferrer"
              tabIndex={copy ? -1 : undefined}
            >
              {entry.title}
            </a>
          ) : (
            entry.title
          )}
        </p>
        {entry.lines.map((line) => (
          <p key={line} className="cv-pane__line project-body-copy">
            {line}
          </p>
        ))}
      </div>
    </li>
  );
}
