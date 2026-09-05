import { readSafari } from "@/lib/safari";

/** Layout top of the open/close hamburger when no toggle is in the DOM yet. */
const FALLBACK_MENU_TOP_PAD = 36;

/** Bumps so a newer section click cancels an in-flight delayed align. */
let alignToken = 0;

/** Extra air under the fixed narrow header after a jump (mobile only). */
const NARROW_SECTION_ALIGN_GAP = 24;

/**
 * Where the section heading’s top should land:
 * - Narrow: under the fixed wordmark/hamburger header, with a little air above
 * - Desktop: level with the left hamburger (cover-flow pin target)
 */
function sectionAlignTop(scroller: HTMLElement): number {
  const narrowHeader = document.querySelector(".project-narrow__header");
  if (narrowHeader instanceof HTMLElement) {
    return (
      narrowHeader.getBoundingClientRect().bottom + NARROW_SECTION_ALIGN_GAP
    );
  }
  const desktop = document.querySelector(
    ".desktop-site-shell__menu-toggle:not(.desktop-site-shell__menu-toggle--end)",
  );
  if (desktop instanceof HTMLElement) {
    return desktop.getBoundingClientRect().top;
  }
  return scroller.getBoundingClientRect().top + FALLBACK_MENU_TOP_PAD;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Stage (and other ancestors) may be CSS-scaled. getBoundingClientRect is in
 * viewport px; scrollTop is in the scroller’s local px — convert before moving.
 */
function viewportDeltaToScrollDelta(
  scroller: HTMLElement,
  deltaView: number,
): number {
  const local = scroller.clientHeight;
  if (local <= 0) return deltaView;
  const view = scroller.getBoundingClientRect().height;
  const scale = view / local;
  if (!Number.isFinite(scale) || scale < 0.01) return deltaView;
  return deltaView / scale;
}

function animateScrollTop(
  scroller: HTMLElement,
  target: number,
  token: number,
  durationMs: number,
) {
  const top = Math.max(0, target);
  if (prefersReducedMotion() || durationMs <= 0) {
    scroller.scrollTop = top;
    return;
  }

  const start = scroller.scrollTop;
  const dist = top - start;
  if (Math.abs(dist) < 1) return;

  const t0 = performance.now();
  /* Match shell ease — cubic out, no mid-flight hard snaps. */
  const easeOut = (t: number) => 1 - (1 - t) ** 3;

  const step = (now: number) => {
    if (token !== alignToken) return;
    const p = Math.min(1, (now - t0) / durationMs);
    scroller.scrollTop = start + dist * easeOut(p);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export type ScrollSectionAlignOptions = {
  /**
   * Wait before measuring (e.g. after menu-hide + smart-object scale).
   * Default 0 — one frame, then a single scroll.
   */
  delayMs?: number;
};

/**
 * One eased scroll so the section heading lands under the fixed chrome
 * (narrow header bottom, or desktop hamburger). Uses a rAF tween — Safari
 * often ignores scrollTo({ behavior: "smooth" }) on nested overflow.
 */
export function scrollSectionToMenuAlign(
  sectionId: string,
  options: ScrollSectionAlignOptions = {},
) {
  const token = ++alignToken;
  const scroller = document.querySelector<HTMLElement>("[data-project-scroll]");
  const heading =
    document.getElementById(`${sectionId}-heading`) ??
    document.querySelector(`#${CSS.escape(sectionId)} .project-section__title`);
  if (!scroller || !(heading instanceof HTMLElement)) return;

  const delayMs = Math.max(0, options.delayMs ?? 0);
  /* Safari needs a beat longer after scale/layout before measuring. */
  const safariPad = readSafari() && delayMs > 0 ? 80 : 0;
  const wait = delayMs + safariPad;

  const run = () => {
    if (token !== alignToken) return;
    /* Force layout so Safari isn’t measuring mid-composite. */
    void scroller.offsetHeight;
    void heading.offsetHeight;

    const deltaView =
      heading.getBoundingClientRect().top - sectionAlignTop(scroller);
    if (Math.abs(deltaView) < 1) return;

    const deltaScroll = viewportDeltaToScrollDelta(scroller, deltaView);
    animateScrollTop(
      scroller,
      scroller.scrollTop + deltaScroll,
      token,
      480,
    );
  };

  if (wait > 0) {
    window.setTimeout(run, wait);
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}
