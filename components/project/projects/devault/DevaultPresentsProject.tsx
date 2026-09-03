"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";

import type { CoverFlowItem } from "@/components/project/CoverFlowCarousel";
import { LazyMount } from "@/components/project/LazyMount";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { ProjectFooter } from "@/components/project/ProjectFooter";
import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import { ProjectSection } from "@/components/project/ProjectSection";
import {
  DEVAULT_LOGOS,
  DEVAULT_PLAYLIST,
  DEVAULT_PODCAST,
  DEVAULT_POSTERS,
  DOC_NOW_SLUG,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

function DevaultGallery({
  items,
  ariaLabel,
}: {
  items: CoverFlowItem[];
  ariaLabel: string;
}) {
  return (
    <LazyMount minHeight={280}>
      <ProjectHorizontalStrip
        items={items}
        ariaLabel={ariaLabel}
        variant="poster"
      />
    </LazyMount>
  );
}

export function DevaultPresentsProject({ menuState }: Props) {
  const sectionsRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const sections = sectionsRef.current;
    const measure = measureRef.current;
    if (!sections || !measure) return;

    const sync = () => {
      const width = measure.offsetWidth;
      if (width > 0) {
        sections.style.setProperty("--devault-title-w", `${width}px`);
      }
    };

    sync();
    void document.fonts.ready.then(sync);
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <div
      ref={sectionsRef}
      className="project-sections project-sections--devault"
      data-menu-state={menuState}
    >
      <ProjectSection id="logo" title="Logo">
        <div className="project-logo-stack">
          <span
            ref={measureRef}
            className="project-logo-stack__measure"
            aria-hidden
          >
            DEVAULT PRESENTS
          </span>
          {DEVAULT_LOGOS.map((logo, index) => (
            <figure key={logo.src} className="project-logo-stack__figure">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="project-logo-stack__image"
                sizes="(max-width: 900px) calc(100vw - 40px), 659px"
                priority={index === 0}
              />
            </figure>
          ))}
        </div>
      </ProjectSection>
      <ProjectSection id="posters" title="Posters">
        <DevaultGallery
          items={DEVAULT_POSTERS}
          ariaLabel="Devault Presents posters"
        />
      </ProjectSection>
      <ProjectSection id="playlist-cover" title="Playlist Cover Art">
        <DevaultGallery
          items={DEVAULT_PLAYLIST}
          ariaLabel="Devault Settings playlist cover art"
        />
      </ProjectSection>
      <ProjectSection id="podcast-cover" title="Podcast Cover Art">
        <DevaultGallery
          items={DEVAULT_PODCAST}
          ariaLabel="Devault Presents podcast cover art"
        />
      </ProjectSection>
      <ProjectFooter
        previousLabel="DOC NOW 2025"
        previousHref={`/design/${DOC_NOW_SLUG}`}
        nextLabel=""
      />
    </div>
  );
}
