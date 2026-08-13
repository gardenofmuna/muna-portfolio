"use client";

import { useEffect, useState } from "react";

import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { ContactTopLinks } from "@/components/ContactTopLinks";
import { CvPressHoverAccordion } from "@/components/CvPressHoverAccordion";
import { DesignCluster } from "@/components/DesignCluster";
import { DesktopSiteShell } from "@/components/DesktopSiteShell";
import { DesktopStageCanvas } from "@/components/DesktopStageCanvas";
import { FilmHoverGif } from "@/components/FilmHoverGif";
import { InstallationLottie } from "@/components/InstallationLottie";
import { PhotosHoverCluster } from "@/components/PhotosHoverCluster";
import { SelectedWorksHoverGif } from "@/components/SelectedWorksHoverGif";
import {
  DESKTOP_LAYOUT_BIO_LEFT,
  getDesktopStageMetrics,
} from "@/lib/desktop-stage";

/**
 * Desktop landing — same 2875×1623 stage + three-quadrant shell as EGWÚ.
 * Menu uses stage containment (shared off-axis position). Hover/bio/contact
 * overlays are authored in layout coordinates and scale with the stage.
 */
export function HomeDesktop() {
  const [activeLabel, setActiveLabel] = useState("contact");
  const [hoverNavLabel, setHoverNavLabel] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const m = getDesktopStageMetrics();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const previewLabel = hoverNavLabel ?? activeLabel;
  const isContact = previewLabel === "contact";
  const showAboutBio = previewLabel === "about" || isContact;
  const fadeMs = reduceMotion ? 80 : 520;

  /** Clear signature column for bio; contact bar meets polaroid flush (no black gap). */
  const bioRightClearOfNzeribe = m.inset + m.nzeribeW + m.gapScaled;
  const contactBarRight = m.inset + m.frameW + 25;

  return (
    <DesktopStageCanvas>
      <DesktopSiteShell
        layout="stage"
        showPolaroid
        menuState="open"
        nav={
          <CircularNavWheel
            layout="desktop"
            containment="stage"
            initialActiveLabel="contact"
            onActiveLabelChange={setActiveLabel}
            onHoverLabelChange={setHoverNavLabel}
          />
        }
        center={<div className="h-full w-full" aria-hidden />}
        stageOverlays={
          <>
            <DesignCluster
              visible={activeLabel === "design"}
              variant="desktop"
              stageLocked
            />
            <InstallationLottie
              visible={activeLabel === "installation"}
              layout="desktop"
              stageLocked
            />
            <PhotosHoverCluster
              visible={hoverNavLabel === "photos"}
              variant="desktop"
              stageLocked
            />
            <FilmHoverGif
              visible={hoverNavLabel === "film"}
              layout="desktop"
              stageLocked
            />
            <CvPressHoverAccordion
              visible={
                hoverNavLabel === "cv + press" || activeLabel === "cv + press"
              }
              layout="desktop"
              stageLocked
            />
            <SelectedWorksHoverGif
              visible={hoverNavLabel === "selected works"}
              layout="desktop"
              stageLocked
            />
            <ContactTopLinks
              visible={isContact}
              stageLocked
              top={`${m.inset}px`}
              left={`${DESKTOP_LAYOUT_BIO_LEFT}px`}
              right={`${contactBarRight}px`}
            />
            <div
              aria-hidden={!showAboutBio}
              className="pointer-events-none absolute z-[30] flex flex-row items-end"
              style={{
                left: DESKTOP_LAYOUT_BIO_LEFT,
                right: bioRightClearOfNzeribe,
                bottom: m.inset,
                opacity: showAboutBio ? 1 : 0,
                transition: reduceMotion
                  ? "none"
                  : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            >
              <AboutBio
                visible={showAboutBio}
                embedded
                stageLocked
                whiteBodyText={isContact}
              />
            </div>
          </>
        }
      />
    </DesktopStageCanvas>
  );
}
