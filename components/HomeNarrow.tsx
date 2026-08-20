"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { DesignCluster } from "@/components/DesignCluster";
import { InstallationLottie } from "@/components/InstallationLottie";
import { MobileFooterLinks } from "@/components/MobileFooterLinks";
import { NarrowArtboard, useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { PhotosHoverCluster } from "@/components/PhotosHoverCluster";
import { CvPressHoverAccordion } from "@/components/CvPressHoverAccordion";
import { FilmHoverGif } from "@/components/FilmHoverGif";
import { SelectedWorksHoverGif } from "@/components/SelectedWorksHoverGif";
import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import { SiteWordmark } from "@/components/SiteWordmark";
import { EGWU_RECORDS_SLUG } from "@/data/projects";
import {
  NARROW_H,
  NARROW_NZERIBE_SCREEN_LEFT,
  NARROW_W,
  NARROW_WHEEL_CENTER,
} from "@/lib/narrow-stage";

/**
 * Artboard_2 (859×1623): centered wheel, wordmark, footer links always on,
 * about/contact bio in wheel hub — no page scroll.
 */
export function HomeNarrow() {
  const router = useRouter();
  const { u } = useNarrowArtboardMetrics();
  const [activeLabel, setActiveLabel] = useState("contact");
  const [hoverNavLabel, setHoverNavLabel] = useState<string | null>(null);
  const [wheelInteracting, setWheelInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [viewportW, setViewportW] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
    const read = () => setViewportW(window.innerWidth);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  /** While spinning, only the label at 12 o'clock previews — no stacked hovers. */
  const previewLabel =
    wheelInteracting && hoverNavLabel ? hoverNavLabel : activeLabel;
  const showAboutBio =
    previewLabel === "about" || previewLabel === "contact";
  const showPhotos = previewLabel === "photos";
  const showDesign = previewLabel === "design";
  const showInstallation = previewLabel === "installation";
  const showCvPress = previewLabel === "cv + press";
  const showFilm = previewLabel === "film";
  const showSelectedWorks = previewLabel === "selected works";
  const fadeMs = wheelInteracting ? 120 : reduceMotion ? 80 : 520;
  const bioFadeStyle = {
    opacity: showAboutBio ? 1 : 0,
    transition: reduceMotion
      ? "none"
      : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    transform: showAboutBio ? "translateY(0)" : "translateY(12px)",
  } as const;
  const landingWheelScale = useMemo(() => {
    if (!viewportW || !u) return 1;
    const currentGroupWidth = NARROW_W * u;
    if (currentGroupWidth <= 0) return 1;
    return Math.min(1, (viewportW - 16) / currentGroupWidth);
  }, [u, viewportW]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      <NarrowArtboard>
        <SiteWordmark screenLeft={NARROW_NZERIBE_SCREEN_LEFT} />
        <MobileFooterLinks />
        <div
          className="absolute left-0 top-0"
          style={{
            width: NARROW_W,
            height: NARROW_H,
            transform: `scale(${landingWheelScale})`,
            transformOrigin: `${NARROW_WHEEL_CENTER.x}px ${NARROW_WHEEL_CENTER.y}px`,
          }}
        >
          <CircularNavWheel
            layout="narrow"
            initialActiveLabel="contact"
            onActiveLabelChange={setActiveLabel}
            onHoverLabelChange={setHoverNavLabel}
            onWheelInteractingChange={setWheelInteracting}
            onLabelActivate={(label) => {
              if (label === "design") {
                router.push(`/design/${EGWU_RECORDS_SLUG}`);
              }
            }}
          />
          <DesignCluster visible={showDesign} variant="narrow" />
          <InstallationLottie visible={showInstallation} layout="narrow" />
          <FilmHoverGif visible={showFilm} layout="narrow" />
          <CvPressHoverAccordion visible={showCvPress} layout="narrow" />
          <SelectedWorksHoverGif visible={showSelectedWorks} layout="narrow" />
          <PhotosHoverCluster visible={showPhotos} variant="narrow" />
          <NarrowCenterPopup visible={showAboutBio} style={bioFadeStyle}>
            <AboutBio
              visible={showAboutBio}
              embedded
              narrowStage
              hubCentered
              whiteBodyText={previewLabel === "contact"}
            />
          </NarrowCenterPopup>
        </div>
      </NarrowArtboard>
    </div>
  );
}
