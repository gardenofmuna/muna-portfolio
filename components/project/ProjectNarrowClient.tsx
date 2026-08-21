"use client";

import type { CSSProperties } from "react";

import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { SiteWordmark } from "@/components/SiteWordmark";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectIndexNav } from "@/components/project/ProjectIndexNav";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
import type { ProjectDefinition } from "@/data/projects";
import {
  NARROW_NZERIBE,
  NARROW_PROJECT_CONTENT_W,
  NARROW_PROJECT_GUTTER_PX,
} from "@/lib/narrow-stage";

type Props = {
  project: ProjectDefinition;
};

/** Hamburger SVG viewBox — keep aspect when height tracks the wordmark. */
const MENU_ASPECT = 107 / 74;
/** Slightly smaller than the nzeribe wordmark height. */
const MENU_HEIGHT_SCALE = 0.85;

export function ProjectNarrowClient({ project }: Props) {
  const { u } = useNarrowArtboardMetrics();
  const scale = u || 1;
  const nzeribeH = NARROW_NZERIBE.h * scale;
  const menuH = nzeribeH * MENU_HEIGHT_SCALE;
  const menuW = menuH * MENU_ASPECT;

  return (
    <div
      className="project-narrow-shell"
      data-menu-state="hidden"
      style={
        {
          "--pn-gutter": `${NARROW_PROJECT_GUTTER_PX}px`,
          "--pn-content-w": NARROW_PROJECT_CONTENT_W,
          "--pn-nzeribe-h": `${nzeribeH}px`,
          "--pn-menu-w": `${menuW}px`,
          "--pn-menu-h": `${menuH}px`,
        } as CSSProperties
      }
    >
      <header className="project-narrow__header">
        <SiteWordmark href="/" placement="flow" />
        <button
          type="button"
          className="project-narrow__menu-toggle"
          aria-label="Open navigation menu"
          aria-expanded={false}
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

      <div className="project-narrow" data-project-scroll="">
        <div className="project-narrow__page">
          <ProjectIndexNav
            activeNumber={project.number}
            total={project.indexTotal}
          />
          <ProjectHeader project={project} menuState="hidden" />
          <EgwuRecordsProject menuState="hidden" gallery="strip" />
        </div>
      </div>
    </div>
  );
}
