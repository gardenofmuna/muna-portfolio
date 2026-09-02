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
import { DESKTOP_LAYOUT_W, getDesktopStageMetrics } from "@/lib/desktop-stage";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

export type ProjectMenuState = "open" | "hidden";

type ProjectScrollApi = {
  scrollToTop: () => void;
};

const ProjectScrollContext = createContext<ProjectScrollApi | null>(null);

export function useProjectScroll() {
  return useContext(ProjectScrollContext);
}

type Props = {
  menuState: ProjectMenuState;
  onMenuStateChange: (state: ProjectMenuState) => void;
  children: ReactNode;
};

const SCROLL_HIDE_THRESHOLD = 48;
const SMART_EASE = "420ms cubic-bezier(0.22, 1, 0.36, 1)";
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
  const [easeScale, setEaseScale] = useState(false);
  const coarsePointer = useCoarsePointer();
  const menuStateRef = useRef(menuState);
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

  useEffect(() => {
    if (menuStateRef.current === menuState) return undefined;
    menuStateRef.current = menuState;
    setEaseScale(true);
    const t = window.setTimeout(() => setEaseScale(false), 450);
    return () => window.clearTimeout(t);
  }, [menuState]);

  const updateSmart = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const m = getDesktopStageMetrics();
    const baseW = Math.max(1, layoutW - m.navZoneOpen - m.signatureZone);
    const hiddenW = Math.max(1, layoutW - m.navZoneClosed - m.signatureZone);
    const scale = menuState === "hidden" ? hiddenW / baseW : 1;
    const innerH = inner.offsetHeight;
    setSmart((prev) => {
      if (prev.scale === scale && prev.baseW === baseW && prev.innerH === innerH) {
        return prev;
      }
      return { scale, baseW, innerH };
    });
  }, [layoutW, menuState]);

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

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const prevScale = scaleRef.current;
    const nextScale = smart.scale || 1;
    if (menuState === "open" && el && el.scrollTop > SCROLL_HIDE_THRESHOLD) {
      userOpenedMenuRef.current = true;
    }
    if (menuState === "hidden") {
      userOpenedMenuRef.current = false;
    }
    if (el && prevScale > 0 && nextScale > 0 && prevScale !== nextScale) {
      el.scrollTop = el.scrollTop * (nextScale / prevScale);
    }
    scaleRef.current = nextScale;
  }, [menuState, smart.scale]);

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
      if (menuState !== "hidden") onMenuStateChange("hidden");
    } else if (el.scrollTop <= 8) {
      if (menuState !== "open") onMenuStateChange("open");
    }
  }, [menuState, onMenuStateChange]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const transition =
    reduceMotion || !easeScale
      ? "none"
      : `transform ${SMART_EASE}, height ${SMART_EASE}`;
  const bleed = menuState === "hidden" ? INNER_BLEED : 0;
  const metrics = getDesktopStageMetrics();
  const paneContentW =
    smart.baseW > 0
      ? Math.max(
          1,
          smart.baseW - metrics.projectGutter - metrics.projectGutterRight,
        )
      : undefined;

  return (
    <ProjectScrollContext.Provider value={{ scrollToTop }}>
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
              transition,
              ["--smart-scale" as string]: String(smart.scale || 1),
            }}
          >
            <div
              ref={innerRef}
              className="project-pane__inner"
              style={{
                width: smart.baseW > 0 ? smart.baseW + bleed : "100%",
                left: -bleed,
                paddingLeft:
                  bleed > 0
                    ? `calc(${bleed}px + var(--project-gutter-left, 0px))`
                    : undefined,
                transform: `scale(${smart.scale})`,
                transformOrigin: `${bleed}px top`,
                transition,
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
