"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { DesktopStageViewContext } from "@/components/DesktopStageCanvas";
import { readSafari, useSafari } from "@/lib/safari";
import { scrollSectionToMenuAlign } from "@/components/project/scrollSectionToMenuAlign";
import { DESKTOP_LAYOUT_W, getDesktopSignatureZoneWidth, getDesktopStageMetrics } from "@/lib/desktop-stage";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

export type ProjectMenuState = "open" | "hidden";

type ProjectScrollApi = {
  scrollToTop: () => void;
  /** Jump so the section heading lines up with the hamburger. */
  scrollToSection: (sectionId: string) => void;
};

const ProjectScrollContext = createContext<ProjectScrollApi | null>(null);

export function useProjectScroll() {
  return useContext(ProjectScrollContext);
}

type Props = {
  menuState: ProjectMenuState;
  onMenuStateChange: (state: ProjectMenuState) => void;
  /** Match shell: narrower signature column when wordmark is “m”. */
  signatureCompact?: boolean;
  children: ReactNode;
};

const SCROLL_HIDE_THRESHOLD = 48;
/**
 * Same duration and curve as the nav-wheel slide. Transform only — a height
 * transition under the stage's scale() makes Safari relayout every frame.
 */
const SMART_MS = 280;
const SMART_EASE = `${SMART_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
/** Extra inner width so scaled overflow (poster fan + shadow) stays inside the transform box. */
const INNER_BLEED = 200;

type SmartScale = {
  scale: number;
  baseW: number;
  innerH: number;
};

/**
 * Menu-open composition is a fixed-width smart object. When the middle
 * column widens (menu hidden), the object is uniformly scaled from the
 * top-left — same layout, no relative reflow.
 */
export function ProjectContentPane({
  menuState,
  onMenuStateChange,
  signatureCompact = false,
  children,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [smart, setSmart] = useState<SmartScale>({
    scale: 1,
    baseW: 0,
    innerH: 0,
  });
  const [reduceMotion, setReduceMotion] = useState(false);
  const safari = useSafari();
  /** True while the smart-object scale is easing. Keeps bleed/origin stable. */
  const [scaling, setScaling] = useState(false);
  const [holdBleed, setHoldBleed] = useState(menuState === "hidden");
  const coarsePointer = useCoarsePointer();
  const appliedScaleRef = useRef(smart.scale || 1);
  const scaleGenRef = useRef(0);
  const [trackedScale, setTrackedScale] = useState(smart.scale);
  const stageView = useContext(DesktopStageViewContext);
  const layoutW = stageView.layoutW || DESKTOP_LAYOUT_W;
  const stageScale = stageView.scale;

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (
    (menuState === "hidden" || (smart.scale || 1) > 1.0005) &&
    !holdBleed
  ) {
    setHoldBleed(true);
  }
  let beginScale = false;
  if (trackedScale !== smart.scale) {
    const from = trackedScale || 1;
    const to = smart.scale || 1;
    setTrackedScale(smart.scale);
    if (!reduceMotion && !safari && Math.abs(from - to) > 0.0005) {
      beginScale = true;
      setScaling(true);
    }
  }
  if (
    holdBleed &&
    !scaling &&
    !beginScale &&
    menuState === "open" &&
    Math.abs((smart.scale || 1) - 1) < 0.0005
  ) {
    setHoldBleed(false);
  }

  const updateSmart = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const m = getDesktopStageMetrics();
    const signatureZone = getDesktopSignatureZoneWidth(signatureCompact);
    const baseW = Math.max(1, layoutW - m.navZoneOpen - signatureZone);
    const hiddenW = Math.max(1, layoutW - m.navZoneClosed - signatureZone);
    const scale = menuState === "hidden" ? hiddenW / baseW : 1;
    const innerH = inner.offsetHeight;
    setSmart((prev) => {
      if (prev.scale === scale && prev.baseW === baseW && prev.innerH === innerH) {
        return prev;
      }
      return { scale, baseW, innerH };
    });
  }, [layoutW, menuState, signatureCompact]);

  useLayoutEffect(() => {
    updateSmart();
    const inner = innerRef.current;
    if (!inner) return;
    const ro = new ResizeObserver(updateSmart);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [updateSmart]);

  const skipClipKickRef = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const bustOverflowClip = () => {
      /* Drop the scrollport clip for one frame so it is recreated in the
         current stage scale. A same-frame scrollTop nudge is optimized away. */
      const targets = [
        el,
        ...el.querySelectorAll(".project-hscroll-wrap, .project-hscroll"),
      ];
      for (const node of targets) {
        if (!(node instanceof HTMLElement)) continue;
        node.style.overflow = "visible";
        void node.offsetHeight;
      }
      requestAnimationFrame(() => {
        for (const node of targets) {
          if (!(node instanceof HTMLElement)) continue;
          node.style.removeProperty("overflow");
        }
      });
    };

    let raf = 0;
    let timer = 0;
    const schedule = () => {
      if (skipClipKickRef.current) return;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(bustOverflowClip);
      });
      timer = window.setTimeout(bustOverflowClip, 80);
    };

    if (skipClipKickRef.current) {
      skipClipKickRef.current = false;
    } else {
      schedule();
    }

    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [stageScale, layoutW]);

  const scaleRef = useRef(1);
  const userOpenedMenuRef = useRef(false);
  const userClosedMenuRef = useRef(false);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const prevScale = scaleRef.current;
    const nextScale = smart.scale || 1;
    if (menuState === "open" && el && el.scrollTop > SCROLL_HIDE_THRESHOLD) {
      userOpenedMenuRef.current = true;
      userClosedMenuRef.current = false;
    }
    if (menuState === "hidden") {
      userOpenedMenuRef.current = false;
      if (el && el.scrollTop <= 8) {
        userClosedMenuRef.current = true;
      }
    }
    if (el && prevScale > 0 && nextScale > 0 && prevScale !== nextScale) {
      el.scrollTop = el.scrollTop * (nextScale / prevScale);
    }
    scaleRef.current = nextScale;
    /* Chrome follows the CSS scale from this frame. Safari snaps the
       invisible page below and eases the visible sheet itself — a layout
       read here would start that ease before the scale has been applied. */
    if (!readSafari()) el?.dispatchEvent(new CustomEvent("panegeometry"));
  }, [menuState, smart.scale]);

  /* Explicit scale(from) → scale(to). A CSS transition that starts from
     `none` snaps in Safari, which is the jump when the dial comes back. */
  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return undefined;
    const target = smart.scale || 1;
    const from = appliedScaleRef.current || 1;
    if (reduceMotion || Math.abs(from - target) < 0.0005) {
      appliedScaleRef.current = target;
      return undefined;
    }
    appliedScaleRef.current = target;
    /* A forced reflow under the stage's scale() makes Safari drop the
       transition and pop the dial and the sheet in one frame. Snap the
       invisible page; CvPane eases the visible sheet on the compositor. */
    if (readSafari()) {
      inner.style.transition = "none";
      if (Math.abs(target - 1) < 0.0005) inner.style.removeProperty("transform");
      else inner.style.transform = `scale(${target})`;
      inner
        .closest("[data-project-scroll]")
        ?.dispatchEvent(new CustomEvent("panegeometry"));
      return undefined;
    }
    const gen = ++scaleGenRef.current;
    inner.style.transition = "none";
    inner.style.transform = `scale(${from})`;
    void inner.offsetWidth;
    inner.style.transition = `transform ${SMART_EASE}`;
    inner.style.transform = `scale(${target})`;
    inner.closest("[data-project-scroll]")?.dispatchEvent(new CustomEvent("panegeometry"));

    const finish = () => {
      if (gen !== scaleGenRef.current) return;
      scaleGenRef.current += 1;
      if (Math.abs(target - 1) < 0.0005) {
        inner.style.transition = "none";
        inner.style.removeProperty("transform");
      }
      setScaling(false);
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== inner || event.propertyName !== "transform") return;
      finish();
    };
    inner.addEventListener("transitionend", onEnd);
    const timer = window.setTimeout(finish, SMART_MS + 80);
    return () => {
      window.clearTimeout(timer);
      inner.removeEventListener("transitionend", onEnd);
    };
  }, [smart.scale, reduceMotion]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const unlock = () => {
      userOpenedMenuRef.current = false;
    };
    el.addEventListener("wheel", unlock, { passive: true });
    el.addEventListener("touchmove", unlock, { passive: true });
    return () => {
      el.removeEventListener("wheel", unlock);
      el.removeEventListener("touchmove", unlock);
    };
  }, []);

  useEffect(() => {
    if (menuState !== "open") return;
    const scroll = scrollRef.current;
    const inner = innerRef.current;
    if (!scroll || !inner) return;

    /* Coarse (iPad): native pan-y on the scrollport — synthesizing touch
       scroll + preventDefault kills inertia and feels dead. */
    if (coarsePointer) return;

    let lastTouchY = 0;

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented) return;
      const delta =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if (delta === 0) return;
      const prev = scroll.scrollTop;
      scroll.scrollTop += delta;
      if (scroll.scrollTop !== prev) event.preventDefault();
    };

    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.defaultPrevented) return;
      const y = event.touches[0]?.clientY ?? lastTouchY;
      const delta = lastTouchY - y;
      lastTouchY = y;
      if (delta === 0) return;
      const prev = scroll.scrollTop;
      scroll.scrollTop += delta;
      if (scroll.scrollTop !== prev) event.preventDefault();
    };

    inner.addEventListener("wheel", onWheel, { passive: false });
    inner.addEventListener("touchstart", onTouchStart, { passive: true });
    inner.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      inner.removeEventListener("wheel", onWheel);
      inner.removeEventListener("touchstart", onTouchStart);
      inner.removeEventListener("touchmove", onTouchMove);
    };
  }, [menuState, coarsePointer]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (userOpenedMenuRef.current) return;
    if (el.scrollTop > SCROLL_HIDE_THRESHOLD) {
      userClosedMenuRef.current = false;
      if (menuState !== "hidden") onMenuStateChange("hidden");
    } else if (el.scrollTop <= 8) {
      if (userClosedMenuRef.current) return;
      if (menuState !== "open") onMenuStateChange("open");
    }
  }, [menuState, onMenuStateChange]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      /* Section jumps always dismiss the nav so the left hamburger exists
         as the align target (and hamburger-open lock cannot block hide). */
      userOpenedMenuRef.current = false;
      userClosedMenuRef.current = false;
      const wasOpen = menuState === "open";
      if (wasOpen) onMenuStateChange("hidden");
      /* Wait for the smart-object scale, then one smooth scroll. */
      scrollSectionToMenuAlign(sectionId, {
        delayMs: wasOpen ? SMART_MS + 40 : 0,
      });
    },
    [menuState, onMenuStateChange],
  );

  const transformTransition =
    reduceMotion || !scaling ? "none" : `transform ${SMART_EASE}`;
  const bleed =
    menuState === "hidden" ||
    holdBleed ||
    scaling ||
    (smart.scale || 1) > 1.0005
      ? INNER_BLEED
      : 0;
  const metrics = getDesktopStageMetrics();
  const paneContentW =
    smart.baseW > 0
      ? Math.max(
          1,
          smart.baseW - metrics.projectGutter - metrics.projectGutterRight,
        )
      : undefined;

  return (
    <ProjectScrollContext.Provider value={{ scrollToTop, scrollToSection }}>
      <div
        ref={paneRef}
        className="project-pane"
        data-menu-state={menuState}
      >
        <div
          ref={scrollRef}
          className="project-pane__scroll"
          data-project-scroll=""
          onScroll={handleScroll}
        >
          <div
            className="project-pane__smart"
            style={{
              height:
                smart.innerH > 0 ? smart.innerH * smart.scale : undefined,
              ["--smart-scale" as string]: String(smart.scale || 1),
            }}
          >
            <div
              ref={innerRef}
              className="project-pane__inner"
              data-scaling={scaling ? "" : undefined}
              style={{
                width: smart.baseW > 0 ? smart.baseW + bleed : "100%",
                left: -bleed,
                paddingLeft:
                  bleed > 0
                    ? `calc(${bleed}px + var(--project-gutter-left, 0px))`
                    : undefined,
                /* scale(1) at rest makes a Safari compositor layer and a 1px seam.
                   Keep it only while the scale is actually easing. */
                transform:
                  scaling || Math.abs(smart.scale - 1) >= 0.0005
                    ? `scale(${smart.scale})`
                    : undefined,
                transformOrigin: `${bleed}px top`,
                transition: transformTransition,
                ["--pane-content-w" as string]: paneContentW
                  ? `${paneContentW}px`
                  : undefined,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </ProjectScrollContext.Provider>
  );
}
