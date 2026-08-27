import Image from "next/image";

import { CoverFlowCarousel } from "@/components/project/CoverFlowCarousel";
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

type GalleryMode = "coverflow" | "strip";

type Props = {
  menuState: ProjectMenuState;
  gallery?: GalleryMode;
};

type DocNowGalleryProps = {
  items: CoverFlowItem[];
  ariaLabel: string;
  itemNoun: string;
  gallery: GalleryMode;
  variant: "poster" | "merchandise" | "website";
  scrollPin?: boolean;
};

function DocNowGallery({
  items,
  ariaLabel,
  itemNoun,
  gallery,
  variant,
  scrollPin = false,
}: DocNowGalleryProps) {
  if (gallery === "strip") {
    return (
      <ProjectHorizontalStrip
        items={items}
        ariaLabel={ariaLabel}
        variant={variant === "website" ? "website" : variant}
      />
    );
  }

  return (
    <CoverFlowCarousel
      items={items}
      ariaLabel={ariaLabel}
      itemNoun={itemNoun}
      variant={variant === "website" ? "website" : variant}
      scrollPin={scrollPin}
    />
  );
}

export function DocNowProject({ menuState, gallery = "coverflow" }: Props) {
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
        <LazyMount>
          <DocNowGallery
            items={DOC_NOW_POSTERS}
            ariaLabel="DOC NOW 2025 posters"
            itemNoun="Poster"
            gallery={gallery}
            variant="poster"
            scrollPin
          />
        </LazyMount>
      </ProjectSection>
      <ProjectSection id="festival-program" title="Festival Program">
        <LazyMount>
          <DocNowGallery
            items={DOC_NOW_PROGRAM}
            ariaLabel="DOC NOW 2025 festival program spreads"
            itemNoun="Program spread"
            gallery={gallery}
            variant="poster"
          />
        </LazyMount>
      </ProjectSection>
      <ProjectSection id="social" title="Social Media Assets">
        <LazyMount>
          <DocNowGallery
            items={DOC_NOW_SOCIAL}
            ariaLabel="DOC NOW 2025 social media assets"
            itemNoun="Social asset"
            gallery={gallery}
            variant="poster"
          />
        </LazyMount>
      </ProjectSection>
      <ProjectSection id="website-design" title="Website Design">
        <LazyMount>
          <DocNowGallery
            items={DOC_NOW_WEBSITE}
            ariaLabel="DOC NOW 2025 website screenshots and recordings"
            itemNoun="Website view"
            gallery={gallery}
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
