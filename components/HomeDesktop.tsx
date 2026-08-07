"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { ContactTopLinks } from "@/components/ContactTopLinks";
import { DesignCluster } from "@/components/DesignCluster";
import { DesktopSiteShell } from "@/components/DesktopSiteShell";
import { InstallationLottie } from "@/components/InstallationLottie";
import { PhotosHoverCluster } from "@/components/PhotosHoverCluster";
import { CvPressHoverAccordion } from "@/components/CvPressHoverAccordion";
import { FilmHoverGif } from "@/components/FilmHoverGif";
import { SelectedWorksHoverGif } from "@/components/SelectedWorksHoverGif";
import { getDesktopCanvasMetrics } from "@/lib/desktop-canvas";

export function HomeDesktop() {
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

  const m = getDesktopCanvasMetrics();
  const isContact = activeLabel === "contact";
  const showAboutBio = activeLabel === "about" || isContact;
  const fadeMs = reduceMotion ? 80 : 520;

  return (
    <DesktopSiteShell showPolaroid darkBackground={isContact}>
      <CircularNavWheel
        layout="desktop"
        initialActiveLabel="contact"
        onActiveLabelChange={setActiveLabel}
        onHoverLabelChange={setHoverNavLabel}
      />
      <DesignCluster visible={activeLabel === "design"} variant="desktop" />
      <InstallationLottie visible={activeLabel === "installation"} layout="desktop" />
      <PhotosHoverCluster
        visible={hoverNavLabel === "photos"}
        variant="desktop"
      />
      <FilmHoverGif visible={hoverNavLabel === "film"} layout="desktop" />
      <CvPressHoverAccordion
        visible={
          hoverNavLabel === "cv + press" || activeLabel === "cv + press"
        }
        layout="desktop"
      />
      <SelectedWorksHoverGif
        visible={hoverNavLabel === "selected works"}
        layout="desktop"
      />
      <ContactTopLinks visible={isContact} top={m.inset} right={m.aboutBioRight} />
      <div
        aria-hidden={!showAboutBio}
        className="pointer-events-none fixed z-[30] flex flex-row items-end"
        style={{
          left: m.bioGroupLeft,
          right: m.bioRightClearOfNzeribe,
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
          whiteBodyText={isContact}
        />
      </div>
    </DesktopSiteShell>
  );
}
