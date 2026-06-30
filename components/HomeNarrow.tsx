"use client";

import { useEffect, useState } from "react";
import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { DesignCluster } from "@/components/DesignCluster";
import { InstallationLottie } from "@/components/InstallationLottie";
import { MobileFooterLinks } from "@/components/MobileFooterLinks";
import { NarrowArtboard } from "@/components/NarrowArtboard";
import { PhotosHoverCluster } from "@/components/PhotosHoverCluster";
import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import { SiteWordmark } from "@/components/SiteWordmark";

/**
 * Artboard_2 (859×1623): centered wheel, wordmark, footer links always on,
 * about/contact bio in wheel hub — no page scroll.
 */
export function HomeNarrow() {
  const [activeLabel, setActiveLabel] = useState("contact");
  const [hoverNavLabel, setHoverNavLabel] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const isContact = activeLabel === "contact";
  const showAboutBio = activeLabel === "about" || isContact;
  const showPhotos =
    activeLabel === "photos" || hoverNavLabel === "photos";
  const showDesign =
    activeLabel === "design" || hoverNavLabel === "design";
  const showInstallation =
    activeLabel === "installation" || hoverNavLabel === "installation";
  const fadeMs = reduceMotion ? 80 : 520;
  const bioFadeStyle = {
    opacity: showAboutBio ? 1 : 0,
    transition: reduceMotion
      ? "none"
      : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.56, 1)`,
    transform: showAboutBio ? "translateY(0)" : "translateY(12px)",
  } as const;

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      <NarrowArtboard>
        <SiteWordmark />
        <MobileFooterLinks />
        <CircularNavWheel
          layout="narrow"
          initialActiveLabel="contact"
          onActiveLabelChange={setActiveLabel}
          onHoverLabelChange={setHoverNavLabel}
        />
        <DesignCluster visible={showDesign} variant="narrow" />
        <InstallationLottie visible={showInstallation} layout="narrow" />
        <PhotosHoverCluster visible={showPhotos} variant="narrow" />
        <NarrowCenterPopup visible={showAboutBio} style={bioFadeStyle}>
          <AboutBio
            visible={showAboutBio}
            embedded
            narrowStage
            hubCentered
            whiteBodyText={isContact}
          />
        </NarrowCenterPopup>
      </NarrowArtboard>
    </div>
  );
}
