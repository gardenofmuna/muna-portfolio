export const PIN_SLACK_PX = 10;
export const PIN_PAST_PX = 36;

export type CoverFlowSectionId = "posters" | "merchandise";

type SectionHandlers = {
  sectionId: CoverFlowSectionId;
  lockEl: HTMLElement;
  heading: HTMLElement;
  getLastIndex: () => number;
  getActiveIndex: () => number;
  goTo: (index: number) => void;
  scrollStep: number;
  minStepMs: number;
  deltaGain: number;
};

type ScrollerPinState = {
  sections: Map<CoverFlowSectionId, SectionHandlers>;
  pinned: boolean;
  activeSectionId: CoverFlowSectionId | null;
  releaseSectionId: CoverFlowSectionId | null;
  releaseDir: "down" | "up" | null;
  accumulated: number;
  lastStepAt: number;
  holding: boolean;
  lastTouchY: number;
};

const scrollerStates = new WeakMap<HTMLElement, ScrollerPinState>();

function getState(scroller: HTMLElement): ScrollerPinState {
  let state = scrollerStates.get(scroller);
  if (!state) {
    state = {
      sections: new Map(),
      pinned: false,
      activeSectionId: null,
      releaseSectionId: null,
      releaseDir: null,
      accumulated: 0,
      lastStepAt: 0,
      holding: false,
      lastTouchY: 0,
    };
    scrollerStates.set(scroller, state);
  }
  return state;
}

function menuIsOpen() {
  const shell = document.querySelector(".desktop-site-shell");
  return shell?.getAttribute("data-menu-state") === "open";
}

function metrics(
  scroller: HTMLElement,
  lockEl: HTMLElement,
  heading: HTMLElement,
) {
  const scrollerRect = scroller.getBoundingClientRect();
  const headingRect = heading.getBoundingClientRect();
  const sectionRect = lockEl.getBoundingClientRect();
  const toggle = document.querySelector(
    ".desktop-site-shell__menu-toggle:not(.desktop-site-shell__menu-toggle--end)",
  );
  const hamburgerTop =
    toggle instanceof HTMLElement
      ? toggle.getBoundingClientRect().top
      : scrollerRect.top + 36;
  return {
    scrollerRect,
    sectionRect,
    drift: headingRect.top - hamburgerTop,
  };
}

function releasePin(
  scroller: HTMLElement,
  state: ScrollerPinState,
  dir: "down" | "up" | null,
  sectionId?: CoverFlowSectionId | null,
) {
  state.pinned = false;
  const releasedSection = sectionId ?? state.activeSectionId;
  state.activeSectionId = null;
  if (dir && releasedSection) {
    state.releaseDir = dir;
    state.releaseSectionId = releasedSection;
  } else {
    state.releaseDir = null;
    state.releaseSectionId = null;
  }
  state.accumulated = 0;
}

function holdPin(
  scroller: HTMLElement,
  state: ScrollerPinState,
  section: SectionHandlers,
) {
  if (state.holding) return;
  state.holding = true;
  requestAnimationFrame(() => {
    state.holding = false;
    if (!state.pinned || menuIsOpen()) {
      if (state.pinned) releasePin(scroller, state, null);
      return;
    }
    const { drift } = metrics(scroller, section.lockEl, section.heading);
    if (Math.abs(drift) > 2) scroller.scrollTop += drift;
  });
}

function stepTo(section: SectionHandlers, index: number, state: ScrollerPinState) {
  const now = performance.now();
  if (now - state.lastStepAt < section.minStepMs) return false;
  state.lastStepAt = now;
  state.accumulated = 0;
  section.goTo(index);
  return true;
}

function applyScrollDelta(
  scroller: HTMLElement,
  state: ScrollerPinState,
  delta: number,
): boolean {
  if (delta === 0 || menuIsOpen()) {
    if (state.pinned) releasePin(scroller, state, null);
    return false;
  }

  const goingDown = delta > 0;
  let active: SectionHandlers | null =
    state.activeSectionId != null
      ? (state.sections.get(state.activeSectionId) ?? null)
      : null;

  if (active) {
    const { sectionRect, scrollerRect } = metrics(
      scroller,
      active.lockEl,
      active.heading,
    );
    if (
      sectionRect.bottom < scrollerRect.top + 8 ||
      sectionRect.top > scrollerRect.bottom - 8
    ) {
      releasePin(scroller, state, null);
      return false;
    }
  }

  if (!state.pinned) {
    /* Only latch when scrolling down the page — upward passes through freely. */
    if (!goingDown) return false;

    let candidate: SectionHandlers | null = null;
    for (const section of state.sections.values()) {
      const { drift, sectionRect, scrollerRect } = metrics(
        scroller,
        section.lockEl,
        section.heading,
      );
      const inZone =
        drift <= PIN_SLACK_PX &&
        drift >= -PIN_PAST_PX &&
        sectionRect.bottom > scrollerRect.top + 80;
      if (!inZone) continue;
      const blocked =
        state.releaseSectionId === section.sectionId &&
        ((state.releaseDir === "down" && goingDown) ||
          (state.releaseDir === "up" && !goingDown));
      if (blocked) continue;
      candidate = section;
      break;
    }
    if (!candidate) return false;

    state.pinned = true;
    state.activeSectionId = candidate.sectionId;
    state.releaseDir = null;
    state.releaseSectionId = null;
    state.accumulated = 0;
    state.lastStepAt = 0;

    if (goingDown && candidate.getActiveIndex() !== 0) candidate.goTo(0);
    active = candidate;
  }

  if (!active) return false;

  const index = active.getActiveIndex();
  const canAdvance = goingDown && index < active.getLastIndex();
  const canRetreat = !goingDown && index > 0;
  if (!canAdvance && !canRetreat) {
    releasePin(scroller, state, goingDown ? "down" : "up", active.sectionId);
    return false;
  }

  holdPin(scroller, state, active);

  state.accumulated += delta * active.deltaGain;
  state.accumulated = Math.max(
    -active.scrollStep * 1.25,
    Math.min(active.scrollStep * 1.25, state.accumulated),
  );

  if (state.accumulated >= active.scrollStep) {
    if (!stepTo(active, index + 1, state)) {
      state.accumulated = active.scrollStep * 0.85;
    }
  } else if (state.accumulated <= -active.scrollStep) {
    if (!stepTo(active, index - 1, state)) {
      state.accumulated = -active.scrollStep * 0.85;
    }
  }
  return true;
}

const listenerOpts: AddEventListenerOptions = { passive: false, capture: true };

function attachScrollerListeners(scroller: HTMLElement, state: ScrollerPinState) {
  if ((scroller as HTMLElement & { __coverFlowPin?: boolean }).__coverFlowPin) {
    return;
  }
  (scroller as HTMLElement & { __coverFlowPin?: boolean }).__coverFlowPin =
    true;

  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    if (applyScrollDelta(scroller, state, delta)) event.preventDefault();
  };

  const onTouchStart = (event: TouchEvent) => {
    state.lastTouchY = event.touches[0]?.clientY ?? 0;
  };

  const onTouchMove = (event: TouchEvent) => {
    const y = event.touches[0]?.clientY ?? state.lastTouchY;
    const delta = state.lastTouchY - y;
    state.lastTouchY = y;
    if (applyScrollDelta(scroller, state, delta)) event.preventDefault();
  };

  const onScroll = () => {
    if (menuIsOpen()) {
      if (state.pinned) releasePin(scroller, state, null);
      return;
    }
    if (state.pinned && state.activeSectionId) {
      const active = state.sections.get(state.activeSectionId);
      if (active) holdPin(scroller, state, active);
    }
  };

  scroller.addEventListener("wheel", onWheel, listenerOpts);
  scroller.addEventListener("touchstart", onTouchStart, listenerOpts);
  scroller.addEventListener("touchmove", onTouchMove, listenerOpts);
  scroller.addEventListener("scroll", onScroll, { passive: true });

  (
    scroller as HTMLElement & {
      __coverFlowPinCleanup?: () => void;
    }
  ).__coverFlowPinCleanup = () => {
    scroller.removeEventListener("wheel", onWheel, listenerOpts);
    scroller.removeEventListener("touchstart", onTouchStart, listenerOpts);
    scroller.removeEventListener("touchmove", onTouchMove, listenerOpts);
    scroller.removeEventListener("scroll", onScroll);
    delete (scroller as HTMLElement & { __coverFlowPin?: boolean })
      .__coverFlowPin;
    delete (
      scroller as HTMLElement & { __coverFlowPinCleanup?: () => void }
    ).__coverFlowPinCleanup;
  };
}

function maybeDetachScrollerListeners(scroller: HTMLElement, state: ScrollerPinState) {
  if (state.sections.size > 0) return;
  const cleanup = (
    scroller as HTMLElement & { __coverFlowPinCleanup?: () => void }
  ).__coverFlowPinCleanup;
  cleanup?.();
  if (state.pinned) releasePin(scroller, state, null);
  scrollerStates.delete(scroller);
}

export function registerCoverFlowScrollPin(
  scroller: HTMLElement,
  handlers: SectionHandlers,
): () => void {
  const state = getState(scroller);
  state.sections.set(handlers.sectionId, handlers);
  attachScrollerListeners(scroller, state);

  return () => {
    const current = getState(scroller);
    current.sections.delete(handlers.sectionId);
    if (current.activeSectionId === handlers.sectionId && current.pinned) {
      releasePin(scroller, current, null);
    }
    maybeDetachScrollerListeners(scroller, current);
  };
}
