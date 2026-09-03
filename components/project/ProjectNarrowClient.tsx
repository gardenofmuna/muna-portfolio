"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { CircularNavWheel } from "@/components/CircularNavWheel";
import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { SiteWordmark } from "@/components/SiteWordmark";
import { DesignProjectNavProvider } from "@/components/project/DesignProjectNav";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectIndexNav } from "@/components/project/ProjectIndexNav";
import { ProjectCaseStudy } from "@/components/project/projects/ProjectCaseStudy";
import { type ProjectDefinition } from "@/data/projects";
import { DESKTOP_LAYOUT_H, DESKTOP_LAYOUT_W } from "@/lib/desktop-stage";
import {
  NARROW_NZERIBE,
  NARROW_PROJECT_CONTENT_W,
} from "@/lib/narrow-stage";

import "./project-pane.css";

type Props = {
  project: ProjectDefinition;
  hideWordmark?: boolean;
  onGoHome?: () => void;
  onProjectChange?: (project: ProjectDefinition) => void;
};

/** Hamburger SVG viewBox — keep aspect when height tracks the wordmark. */
const MENU_ASPECT = 107 / 74;
/** Slightly smaller than the nzeribe wordmark height. */
const MENU_HEIGHT_SCALE = 0.85;

export function ProjectNarrowClient({
  project,
  hideWordmark = false,
  onGoHome,
  onProjectChange,
}: Props) {
  const { u } = useNarrowArtboardMetrics();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewportH, setViewportH] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const headerScrolledRef = useRef(false);
  const scale = u || 1;
  const nzeribeH = NARROW_NZERIBE.h * scale;
  const menuH = nzeribeH * MENU_HEIGHT_SCALE;
  const menuW = menuH * MENU_ASPECT;
  const navScale =
    viewportH > 0 ? viewportH / DESKTOP_LAYOUT_H : 0;

  useEffect(() => {
    const read = () => {
      setViewportH(window.visualViewport?.height ?? window.innerHeight);
    };
    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const header = headerRef.current;
    if (!scroller || !header) return;

    const sync = () => {
      const next = scroller.scrollTop > 8;
      if (next === headerScrolledRef.current) return;
      headerScrolledRef.current = next;
      header.toggleAttribute("data-scrolled", next);
    };

    sync();
    scroller.addEventListener("scroll", sync, { passive: true });
    return () => scroller.removeEventListener("scroll", sync);
  }, [project.slug]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleProjectChange = useCallback(
    (next: ProjectDefinition) => {
      onProjectChange?.(next);
    },
    [onProjectChange],
  );

  const goHome = useCallback(() => {
    closeMenu();
    onGoHome?.();
  }, [closeMenu, onGoHome]);

  return (
    <DesignProjectNavProvider onProjectChange={handleProjectChange}>
    <div
      className="project-narrow-shell"
      data-menu-state={menuOpen ? "open" : "hidden"}
      data-hide-wordmark={hideWordmark || menuOpen ? "" : undefined}
      style={
        {
          "--pn-content-w": NARROW_PROJECT_CONTENT_W,
          "--pn-nzeribe-h": `${nzeribeH}px`,
          "--pn-menu-w": `${menuW}px`,
          "--pn-menu-h": `${menuH}px`,
        } as CSSProperties
      }
    >
      <header ref={headerRef} className="project-narrow__header">
        {hideWordmark ? null : (
          <SiteWordmark href="/" placement="flow" onClick={(event) => {
            if (!onGoHome) return;
            event.preventDefault();
            goHome();
          }} />
        )}
        <button
          type="button"
          className="project-narrow__menu-toggle"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((open) => !open);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
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
      </header>

      <div
        ref={scrollerRef}
        className="project-narrow"
        data-project-scroll=""
        inert={menuOpen ? true : undefined}
      >
        <div className="project-narrow__page">
          <ProjectIndexNav
            activeNumber={project.number}
            total={project.indexTotal}
          />
          <ProjectHeader project={project} menuState="hidden" />
          <ProjectCaseStudy
            project={project}
            menuState="hidden"
            gallery="strip"
          />
        </div>
      </div>

      {menuOpen && navScale > 0 ? (
        <div
          className="project-narrow__nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div
            className="project-narrow__nav-stage"
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
              initialActiveLabel="design"
              onLabelActivate={(label) => {
                if (label === "design") {
                  closeMenu();
                  return;
                }
                goHome();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
    </DesignProjectNavProvider>
  );
}
