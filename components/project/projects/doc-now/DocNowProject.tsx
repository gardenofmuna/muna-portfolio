"use client";

import Image from "next/image";

import type { CoverFlowItem } from "@/components/project/CoverFlowCarousel";
import { LazyMount } from "@/components/project/LazyMount";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { ProjectFooter } from "@/components/project/ProjectFooter";
import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import { ProjectLoopVideo } from "@/components/project/ProjectLoopVideo";
import { ProjectSection } from "@/components/project/ProjectSection";
import { FestivalProgramMedia } from "@/components/project/projects/doc-now/FestivalProgramBook";
import { DocNowColorsSection } from "@/components/project/projects/doc-now/DocNowColorsSection";
import { useProjectSurface } from "@/components/project/useProjectSurface";
import {
  DOC_NOW_LOGO,
  DOC_NOW_POSTERS,
  DOC_NOW_POSTERS_BOARD,
  DOC_NOW_PROGRAM,
  DOC_NOW_SOCIAL,
  DOC_NOW_WEBSITE,
  DEVAULT_PRESENTS_SLUG,
  EGWU_RECORDS_SLUG,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
  gallery?: "coverflow" | "strip";
};

type DocNowGalleryProps = {
  items: CoverFlowItem[];
  ariaLabel: string;
  variant: "poster" | "website";
};

const DOC_NOW_WEBSITE_STILLS = DOC_NOW_WEBSITE.filter(
  (item) => item.kind !== "video",
);
const DOC_NOW_WEBSITE_VIDEOS = DOC_NOW_WEBSITE.filter(
  (item) => item.kind === "video",
);

function DocNowGallery({ items, ariaLabel, variant }: DocNowGalleryProps) {
  return (
    <ProjectHorizontalStrip
      items={items}
      ariaLabel={ariaLabel}
      variant={variant}
    />
  );
}

function DocNowPostersMedia() {
  const { probeRef, surface } = useProjectSurface();

  return (
    <div ref={probeRef}>
      {surface === "pane" ? (
        <div
          className="project-poster-static"
          role="group"
          aria-label="DOC NOW 2025 posters"
        >
          {DOC_NOW_POSTERS_BOARD.map((poster) => (
            <figure key={poster.src} className="project-poster-static__item">
              <Image
                src={poster.src}
                alt={poster.alt}
                width={poster.width}
                height={poster.height}
                className="project-poster-static__image"
                sizes="(max-width: 900px) 42vw, 220px"
                quality={85}
              />
            </figure>
          ))}
        </div>
      ) : surface === "narrow" ? (
        <DocNowGallery
          items={DOC_NOW_POSTERS}
          ariaLabel="DOC NOW 2025 posters"
          variant="poster"
        />
      ) : (
        <div style={{ minHeight: 280 }} aria-hidden />
      )}
    </div>
  );
}

function DocNowWebsiteMedia() {
  const { probeRef, surface } = useProjectSurface();

  return (
    <div ref={probeRef}>
      {surface === "pane" ? (
        <div className="project-website-design">
          <DocNowGallery
            items={DOC_NOW_WEBSITE_STILLS}
            ariaLabel="DOC NOW 2025 website screenshots"
            variant="website"
          />
          <div className="project-website-videos">
            {DOC_NOW_WEBSITE_VIDEOS.map((item) => (
              <ProjectLoopVideo
                key={item.src}
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="project-website-videos__video"
                togglePlayback
              />
            ))}
          </div>
        </div>
      ) : surface === "narrow" ? (
        <DocNowGallery
          items={DOC_NOW_WEBSITE}
          ariaLabel="DOC NOW 2025 website screenshots and recordings"
          variant="website"
        />
      ) : (
        <div style={{ minHeight: 280 }} aria-hidden />
      )}
    </div>
  );
}

export function DocNowProject({ menuState }: Props) {
  return (
    <div className="project-sections project-sections--doc-now" data-menu-state={menuState}>
      <ProjectSection id="logo-refresh" title="Logo Refresh">
        <figure className="project-asset-single project-asset-single--doc-logo">
          <Image
            src={DOC_NOW_LOGO.src}
            alt={DOC_NOW_LOGO.alt}
            width={DOC_NOW_LOGO.width}
            height={DOC_NOW_LOGO.height}
            className="project-asset-single__image"
            sizes="(max-width: 900px) 70vw, 240px"
            unoptimized
            priority
          />
        </figure>
      </ProjectSection>
      <ProjectSection id="colors" title="Colors">
        <DocNowColorsSection />
      </ProjectSection>
      <ProjectSection id="posters" title="Posters">
        <LazyMount afterScroll minHeight={280}>
          <DocNowPostersMedia />
        </LazyMount>
      </ProjectSection>
      <ProjectSection id="festival-program" title="Festival Program">
        <LazyMount afterScroll minHeight={280}>
          <FestivalProgramMedia items={DOC_NOW_PROGRAM} />
        </LazyMount>
      </ProjectSection>
      <ProjectSection id="social" title="Social Media Assets">
        <LazyMount afterScroll minHeight={280}>
          <DocNowGallery
            items={DOC_NOW_SOCIAL}
            ariaLabel="DOC NOW 2025 social media assets"
            variant="poster"
          />
        </LazyMount>
      </ProjectSection>
      <ProjectSection id="website-design" title="Website Design">
        <LazyMount afterScroll minHeight={280}>
          <DocNowWebsiteMedia />
        </LazyMount>
      </ProjectSection>
      <ProjectFooter
        previousLabel="EGWÚ RECORDS"
        previousHref={`/design/${EGWU_RECORDS_SLUG}`}
        nextLabel="DEVAULT"
        nextHref={`/design/${DEVAULT_PRESENTS_SLUG}`}
      />
    </div>
  );
}
