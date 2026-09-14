"use client";

import type { CoverFlowItem } from "@/components/project/CoverFlowCarousel";
import { LazyMount } from "@/components/project/LazyMount";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { ProjectFooter } from "@/components/project/ProjectFooter";
import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import { ProjectSection } from "@/components/project/ProjectSection";
import { useProjectSurface } from "@/components/project/useProjectSurface";
import {
  BOUNCE_ARTICLE_SQUARE,
  BOUNCE_ARTICLE_WIDE,
  BOUNCE_PLAYLIST_COVERS,
  DEVAULT_PRESENTS_SLUG,
  STUDIO_ORRY_SLUG,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

function BounceGallery({
  items,
  ariaLabel,
  variant = "poster",
}: {
  items: CoverFlowItem[];
  ariaLabel: string;
  variant?: "poster" | "website";
}) {
  return (
    <LazyMount minHeight={280}>
      <ProjectHorizontalStrip
        items={items}
        ariaLabel={ariaLabel}
        variant={variant}
      />
    </LazyMount>
  );
}

function BounceArticleMedia() {
  const { probeRef, surface } = useProjectSurface();

  return (
    <div ref={probeRef}>
      {surface === "pane" ? (
        <BounceGallery
          items={BOUNCE_ARTICLE_WIDE}
          ariaLabel="Bounce Radio article cover art"
          variant="website"
        />
      ) : surface === "narrow" ? (
        <BounceGallery
          items={BOUNCE_ARTICLE_SQUARE}
          ariaLabel="Bounce Radio article cover art"
        />
      ) : (
        <div style={{ minHeight: 280 }} aria-hidden />
      )}
    </div>
  );
}

export function BounceRadioProject({ menuState }: Props) {
  return (
    <div
      className="project-sections project-sections--bounce"
      data-menu-state={menuState}
    >
      <ProjectSection id="playlist-cover" title="Playlist Covers">
        <BounceGallery
          items={BOUNCE_PLAYLIST_COVERS}
          ariaLabel="Bounce Radio playlist covers"
        />
      </ProjectSection>
      <ProjectSection id="article-cover" title="Article Cover Art">
        <BounceArticleMedia />
      </ProjectSection>
      <ProjectFooter
        previousLabel="DEVAULT PRESENTS"
        previousHref={`/design/${DEVAULT_PRESENTS_SLUG}`}
        nextLabel="STUDIO ORRY"
        nextHref={`/design/${STUDIO_ORRY_SLUG}`}
      />
    </div>
  );
}
