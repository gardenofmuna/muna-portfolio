"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

import { CircularNavWheel } from "@/components/CircularNavWheel";
import { SiteWordmark } from "@/components/SiteWordmark";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectIndexNav } from "@/components/project/ProjectIndexNav";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
import type { ProjectDefinition } from "@/data/projects";
import {
  NARROW_H,
  NARROW_PROJECT_CONTENT_W,
  NARROW_PROJECT_GUTTER_PX,
  NARROW_PROJECT_WHEEL_ENLARGE,
  NARROW_PROJECT_WHEEL_PEEK,
  NARROW_W,
  NARROW_WHEEL_CENTER,
  NARROW_WHEEL_OUTER_DIAMETER,
} from "@/lib/narrow-stage";

const SCROLL_HIDE_THRESHOLD = 48;
/** Apply menu show/hide after scroll settles — avoids layout thrash mid-gesture. */
const SCROLL_IDLE_MS = 140;

type Props = {
  project: ProjectDefinition;
};

/** Layout-viewport space covered by mobile browser chrome at the bottom. */
function readChromeBottom(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
}

/** Homescreen / installed web app (iOS standalone or display-mode). */
function readStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function ProjectNarrowClient({ project }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  const [viewportW, setViewportW] = useState(390);
  const [chromeBottom, setChromeBottom] = useState(0);
  const [standalone, setStandalone] = useState(false);
  const userOpenedMenuRef = useRef(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chromeRafRef = useRef(0);
  const lastChromeRef = useRef(0);
  const lastWidthRef = useRef(390);

  useEffect(() => {
    const applyViewport = () => {
      chromeRafRef.current = 0;
      const nextW = window.visualViewport?.width
        ? Math.round(window.visualViewport.width)
        : window.innerWidth;
      const nextChrome = readChromeBottom();
      setStandalone(readStandalone());
      if (nextW !== lastWidthRef.current) {
        lastWidthRef.current = nextW;
        setViewportW(nextW);
      }
      /* Ignore sub-pixel chrome chatter from iOS URL-bar animation mid-scroll. */
      if (Math.abs(nextChrome - lastChromeRef.current) >= 2) {
        lastChromeRef.current = nextChrome;
        setChromeBottom(nextChrome);
      }
    };

    const scheduleViewport = () => {
      if (chromeRafRef.current) return;
      chromeRafRef.current = requestAnimationFrame(applyViewport);
    };

    applyViewport();
    window.addEventListener("resize", scheduleViewport, { passive: true });
    const standaloneMq = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => setStandalone(readStandalone());
    standaloneMq.addEventListener?.("change", onDisplayMode);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", scheduleViewport, { passive: true });
    return () => {
      window.removeEventListener("resize", scheduleViewport);
      standaloneMq.removeEventListener?.("change", onDisplayMode);
      vv?.removeEventListener("resize", scheduleViewport);
      if (chromeRafRef.current) cancelAnimationFrame(chromeRafRef.current);
    };
  }, []);

  const syncMenuToScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (userOpenedMenuRef.current) return;
    if (el.scrollTop > SCROLL_HIDE_THRESHOLD) {
      setMenuOpen(false);
    } else if (el.scrollTop <= 8) {
      setMenuOpen(true);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (userOpenedMenuRef.current) return;
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    scrollIdleTimerRef.current = setTimeout(() => {
      scrollIdleTimerRef.current = null;
      syncMenuToScroll();
    }, SCROLL_IDLE_MS);
  }, [syncMenuToScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const unlock = () => {
      userOpenedMenuRef.current = false;
    };

    const onScrollEnd = () => {
      if (scrollIdleTimerRef.current) {
        clearTimeout(scrollIdleTimerRef.current);
        scrollIdleTimerRef.current = null;
      }
      syncMenuToScroll();
    };

    el.addEventListener("wheel", unlock, { passive: true });
    el.addEventListener("touchmove", unlock, { passive: true });
    el.addEventListener("touchend", onScrollEnd, { passive: true });
    el.addEventListener("scrollend", onScrollEnd as EventListener, {
      passive: true,
    });
    return () => {
      el.removeEventListener("wheel", unlock);
      el.removeEventListener("touchmove", unlock);
      el.removeEventListener("touchend", onScrollEnd);
      el.removeEventListener("scrollend", onScrollEnd as EventListener);
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    };
  }, [syncMenuToScroll]);

  const openMenu = useCallback(() => {
    userOpenedMenuRef.current = true;
    setMenuOpen(true);
  }, []);

  /* Wheel only: full-bleed vw/859 (page content uses 20px gutters separately). */
  const baseU = Math.max(viewportW / NARROW_W, 0.001);
  const peek = NARROW_PROJECT_WHEEL_PEEK * baseU;
  /* Figma crop enlarged, then slightly reduced for the peek. */
  const wheelU = baseU * NARROW_PROJECT_WHEEL_ENLARGE * 0.86;
  const outerScreen = (NARROW_WHEEL_OUTER_DIAMETER / 2) * wheelU;
  const stageTranslateX = (viewportW - NARROW_W * wheelU) / 2;
  /* Pure downward shift of the wheel (does not grow the peek band). */
  const wheelDown = 60 * baseU;
  const stageTranslateY =
    outerScreen - NARROW_WHEEL_CENTER.y * wheelU + wheelDown;

  return (
    <div
      className="project-narrow-shell"
      data-menu-state={menuOpen ? "open" : "hidden"}
      data-display={standalone ? "standalone" : "browser"}
      style={
        {
          "--pn-gutter": `${NARROW_PROJECT_GUTTER_PX}px`,
          "--pn-content-w": NARROW_PROJECT_CONTENT_W,
          "--pn-wheel-peek": `${peek}px`,
          "--pn-chrome-bottom": `${chromeBottom}px`,
        } as CSSProperties
      }
    >
      <header className="project-narrow__header">
        <SiteWordmark href="/" placement="flow" />
        {!menuOpen ? (
          <button
            type="button"
            className="project-narrow__menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={false}
            onClick={openMenu}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="107"
              height="74"
              viewBox="0 0 107 74"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                fill="#000"
                d="M0.801,73.857 L0.801,62.195 L106.310,62.195 L106.310,73.857 L0.801,73.857 ZM0.801,31.098 L106.310,31.098 L106.310,42.759 L0.801,42.759 L0.801,31.098 ZM0.801,-0.000 L106.310,-0.000 L106.310,11.661 L0.801,11.661 L0.801,-0.000 Z"
              />
            </svg>
          </button>
        ) : null}
      </header>

      <div
        ref={scrollRef}
        className="project-narrow"
        data-project-scroll=""
        onScroll={handleScroll}
      >
        <div className="project-narrow__page">
          <ProjectIndexNav
            activeNumber={project.number}
            total={project.indexTotal}
          />
          <ProjectHeader project={project} menuState="hidden" />
          <EgwuRecordsProject menuState="hidden" gallery="strip" />
        </div>
      </div>

      {/* Keep mounted — remounting mid-scroll caused jank; hide via CSS. */}
      <div
        className="project-narrow__wheel"
        aria-label="Site navigation"
        aria-hidden={!menuOpen}
        style={{ height: peek }}
      >
        <div className="project-narrow__wheel-veil" aria-hidden />
        <div className="project-narrow__wheel-clip">
          <div
            className="project-narrow__wheel-stage"
            style={{
              width: NARROW_W,
              height: NARROW_H,
              transform: `translate(${stageTranslateX}px, ${stageTranslateY}px) scale(${wheelU})`,
            }}
          >
            <CircularNavWheel
              layout="narrow"
              initialActiveLabel="design"
              onLabelActivate={(label) => {
                if (label === "design") return;
                router.push("/");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
