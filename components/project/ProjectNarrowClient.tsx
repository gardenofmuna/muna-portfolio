"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { CircularNavWheel } from "@/components/CircularNavWheel";
import { SiteWordmark } from "@/components/SiteWordmark";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectIndexNav } from "@/components/project/ProjectIndexNav";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
import type { ProjectDefinition } from "@/data/projects";
import {
  NARROW_H,
  NARROW_PROJECT_WHEEL_ENLARGE,
  NARROW_PROJECT_WHEEL_PEEK,
  NARROW_W,
  NARROW_WHEEL_CENTER,
  NARROW_WHEEL_OUTER_DIAMETER,
} from "@/lib/narrow-stage";

const SCROLL_HIDE_THRESHOLD = 48;

type Props = {
  project: ProjectDefinition;
};

/** Layout-viewport space covered by mobile browser chrome at the bottom. */
function readChromeBottom(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
}

export function ProjectNarrowClient({ project }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  const [viewportW, setViewportW] = useState(390);
  const [chromeBottom, setChromeBottom] = useState(0);
  const userOpenedMenuRef = useRef(false);

  useEffect(() => {
    const read = () => {
      setViewportW(window.innerWidth);
      setChromeBottom(readChromeBottom());
    };
    read();
    window.addEventListener("resize", read);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", read);
    vv?.addEventListener("scroll", read);
    return () => {
      window.removeEventListener("resize", read);
      vv?.removeEventListener("resize", read);
      vv?.removeEventListener("scroll", read);
    };
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (userOpenedMenuRef.current) return;
    if (el.scrollTop > SCROLL_HIDE_THRESHOLD) {
      setMenuOpen(false);
    } else if (el.scrollTop <= 8) {
      setMenuOpen(true);
    }
  }, []);

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

  const openMenu = useCallback(() => {
    userOpenedMenuRef.current = true;
    setMenuOpen(true);
  }, []);

  /* Artboard → screen: same u as page (vw/859). Peek 194 scales with it. */
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
      style={
        {
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

      {menuOpen ? (
        <div
          className="project-narrow__wheel"
          aria-label="Site navigation"
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
      ) : null}
    </div>
  );
}
