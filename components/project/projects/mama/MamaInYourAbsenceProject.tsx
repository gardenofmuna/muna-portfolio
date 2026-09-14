"use client";

import Image from "next/image";

import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { ProjectFooter } from "@/components/project/ProjectFooter";
import { ProjectSection } from "@/components/project/ProjectSection";
import { MamaPostcardFlip } from "@/components/project/projects/mama/MamaPostcardFlip";
import {
  MAMA_POSTCARD_MOCKUP,
  MAMA_POSTER,
  STUDIO_ORRY_SLUG,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

export function MamaInYourAbsenceProject({ menuState }: Props) {
  return (
    <div
      className="project-sections project-sections--mama"
      data-menu-state={menuState}
    >
      <ProjectSection id="postcard" title="Postcard">
        <div className="project-mama-postcards">
          <figure className="project-mama-postcards__mockup">
            <Image
              src={MAMA_POSTCARD_MOCKUP.src}
              alt={MAMA_POSTCARD_MOCKUP.alt}
              width={MAMA_POSTCARD_MOCKUP.width}
              height={MAMA_POSTCARD_MOCKUP.height}
              className="project-mama-postcards__mockup-image"
              sizes="(max-width: 900px) 92vw, 330px"
              priority
            />
          </figure>
          <MamaPostcardFlip />
        </div>
      </ProjectSection>
      <ProjectSection id="poster" title="Poster">
        <figure className="project-mama-figure">
          <Image
            src={MAMA_POSTER.src}
            alt={MAMA_POSTER.alt}
            width={MAMA_POSTER.width}
            height={MAMA_POSTER.height}
            className="project-mama-figure__image"
            sizes="(max-width: 900px) 92vw, 659px"
          />
        </figure>
      </ProjectSection>
      <ProjectFooter
        previousLabel="STUDIO ORRY"
        previousHref={`/design/${STUDIO_ORRY_SLUG}`}
        nextLabel=""
      />
    </div>
  );
}
