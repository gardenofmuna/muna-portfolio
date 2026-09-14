"use client";

import Image from "next/image";

import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { ProjectFooter } from "@/components/project/ProjectFooter";
import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import { ProjectSection } from "@/components/project/ProjectSection";
import { useProjectSurface } from "@/components/project/useProjectSurface";
import {
  BOUNCE_RADIO_SLUG,
  MAMA_IN_YOUR_ABSENCE_SLUG,
  ORRY_CURRENCY,
  ORRY_FLYERS,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

function OrryFlyerMedia() {
  const { probeRef, surface } = useProjectSurface();

  return (
    <div ref={probeRef}>
      {surface === "pane" ? (
        <div className="project-orry-flyers">
          {ORRY_FLYERS.map((flyer, index) => (
            <figure key={flyer.src} className="project-orry-flyers__item">
              <Image
                src={flyer.src}
                alt={flyer.alt}
                width={flyer.width}
                height={flyer.height}
                className="project-orry-flyers__image"
                sizes="(max-width: 900px) 72vw, 50vw"
                priority={index === 0}
              />
            </figure>
          ))}
        </div>
      ) : surface === "narrow" ? (
        <ProjectHorizontalStrip
          items={ORRY_FLYERS}
          ariaLabel="A wà ńbẹ̀ exhibition posters"
          variant="poster"
        />
      ) : (
        <div style={{ minHeight: 280 }} aria-hidden />
      )}
    </div>
  );
}

export function StudioOrryProject({ menuState }: Props) {
  return (
    <div
      className="project-sections project-sections--orry"
      data-menu-state={menuState}
    >
      <ProjectSection id="exhibition-poster" title="Exhibition Poster">
        <OrryFlyerMedia />
      </ProjectSection>
      <ProjectSection id="prop-currency" title="Prop Currency Design">
        <div className="project-orry-notes">
          {ORRY_CURRENCY.map((note) => (
            <figure key={note.src} className="project-orry-notes__item">
              <Image
                src={note.src}
                alt={note.alt}
                width={note.width}
                height={note.height}
                className="project-orry-notes__image"
                sizes="(max-width: 900px) 92vw, 659px"
              />
            </figure>
          ))}
        </div>
      </ProjectSection>
      <ProjectFooter
        previousLabel="BOUNCE RADIO"
        previousHref={`/design/${BOUNCE_RADIO_SLUG}`}
        nextLabel="MAMA, IN YOUR ABSENCE"
        nextHref={`/design/${MAMA_IN_YOUR_ABSENCE_SLUG}`}
      />
    </div>
  );
}
