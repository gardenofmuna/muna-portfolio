"use client";

import Image from "next/image";

import type { CoverFlowItem } from "@/components/project/CoverFlowCarousel";
import { LazyMount } from "@/components/project/LazyMount";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { ProjectFooter } from "@/components/project/ProjectFooter";
import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import { ProjectSection } from "@/components/project/ProjectSection";
import {
  DOC_NOW_COLORS,
  DOC_NOW_LOGO,
  DOC_NOW_POSTERS,
  DOC_NOW_PROGRAM,
  DOC_NOW_SOCIAL,
  DOC_NOW_WEBSITE,
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

function DocNowGallery({ items, ariaLabel, variant }: DocNowGalleryProps) {
  return (
    <ProjectHorizontalStrip
      items={items}
      ariaLabel={ariaLabel}
      variant={variant}
    />
  );
}

export function DocNowProject({ menuState }: Props) {
  return (
    <div className="project-sections" data-menu-state={menuState}>
      <ProjectSection id="logo-refresh" title="Logo Refresh">
        <figure className="project-asset-single project-asset-single--doc-logo">
          <Image
            src={DOC_NOW_LOGO.src}
            alt={DOC_NOW_LOGO.alt}
            width={DOC_NOW_LOGO.width}
            height={DOC_NOW_LOGO.height}
            className="project-asset-single__image"
            sizes="(max-width: 900px) 70vw, 380px"
            unoptimized
            priority
          />
        </figure>
      </ProjectSection>
      <ProjectSection id="colors" title="Colors">
        <figure className="project-asset-single project-asset-single--colors">
          <Image
            src={DOC_NOW_COLORS.src}
            alt={DOC_NOW_COLORS.alt}
            width={DOC_NOW_COLORS.width}
            height={DOC_NOW_COLORS.height}
            className="project-asset-single__image"
            sizes="(max-width: 900px) 90vw, 561px"
          />
        </figure>
      </ProjectSection>
      <ProjectSection id="posters" title="Posters">
        <LazyMount afterScroll minHeight={280}>
          <DocNowGallery
            items={DOC_NOW_POSTERS}
            ariaLabel="DOC NOW 2025 posters"
            variant="poster"
          />
        </LazyMount>
      </ProjectSection>
      <ProjectSection id="festival-program" title="Festival Program">
        <LazyMount afterScroll minHeight={280}>
          <DocNowGallery
            items={DOC_NOW_PROGRAM}
            ariaLabel="DOC NOW 2025 festival program spreads"
            variant="poster"
          />
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
          <DocNowGallery
            items={DOC_NOW_WEBSITE}
            ariaLabel="DOC NOW 2025 website screenshots and recordings"
            variant="website"
          />
        </LazyMount>
      </ProjectSection>
      <ProjectFooter
        previousLabel="EGWÚ RECORDS"
        previousHref={`/design/${EGWU_RECORDS_SLUG}`}
        nextLabel=""
      />
    </div>
  );
}
