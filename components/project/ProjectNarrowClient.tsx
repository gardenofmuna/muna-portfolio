"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CircularNavWheel } from "@/components/CircularNavWheel";
import { SiteWordmark } from "@/components/SiteWordmark";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectIndexNav } from "@/components/project/ProjectIndexNav";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
import type { ProjectDefinition } from "@/data/projects";
import {
  NARROW_H,
  NARROW_W,
  NARROW_WHEEL_CENTER,
  NARROW_WHEEL_R,
} from "@/lib/narrow-stage";

const SCROLL_HIDE_THRESHOLD = 48;

type Props = {
  project: ProjectDefinition;
};

export function ProjectNarrowClient({ project }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(true);
  const [wheelScale, setWheelScale] = useState(1);
  const [viewportH, setViewportH] = useState(800);
  const userOpenedMenuRef = useRef(false);

  useEffect(() => {
    const read = () => {
      setWheelScale(window.innerWidth / NARROW_W);
      setViewportH(window.innerHeight);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
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

  const u = Math.max(wheelScale, 0.001);
  const radiusScreen = NARROW_WHEEL_R * u;
  const peek = Math.round(Math.min(160, Math.max(112, viewportH * 0.16)));
  const stageTranslateY = peek + radiusScreen - NARROW_WHEEL_CENTER.y * u;

  return (
    <div
      ref={scrollRef}
      className="project-narrow"
      data-project-scroll=""
      data-menu-state={menuOpen ? "open" : "hidden"}
      onScroll={handleScroll}
    >
      <div className="project-narrow__page">
        <SiteWordmark href="/" placement="flow" />
        <ProjectIndexNav
          activeNumber={project.number}
          total={project.indexTotal}
        />
        <ProjectHeader project={project} menuState="hidden" />
        <EgwuRecordsProject menuState="hidden" />
      </div>

      {menuOpen ? (
        <div
          className="project-narrow__wheel"
          aria-label="Site navigation"
          style={{ height: peek }}
        >
          <div
            className="project-narrow__wheel-stage"
            style={{
              width: NARROW_W,
              height: NARROW_H,
              transform: `translateY(${stageTranslateY}px) scale(${u})`,
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
      ) : (
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
      )}
    </div>
  );
}
