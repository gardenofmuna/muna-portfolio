"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { ContactTopLinks } from "@/components/ContactTopLinks";
import { DesignCluster } from "@/components/DesignCluster";
import { InstallationLottie } from "@/components/InstallationLottie";
import { PhotosHoverCluster } from "@/components/PhotosHoverCluster";
import { FilmHoverGif } from "@/components/FilmHoverGif";
import { SelectedWorksHoverGif } from "@/components/SelectedWorksHoverGif";

/** Layout baseline: image frames 544×659, inset 100, at this viewport height */
const REF_PAGE_HEIGHT = 1624;
const REF_INSET = 100;
const IMG_W = 544;
const IMG_H = 659;
const NZERIBE_IMG_W = 546;
const NZERIBE_IMG_H = 117;
const ABOUT_GAP_FROM_WEBP_PX = 20;
const U_BIO = "min(100vw / 1440, 100vh / 811.5)";
const BIO_GROUP_LEFT = `calc(392 * ${U_BIO})`;

/**
 * Full home composition. Intended to run inside an iframe sized 1440×1624 so `vw`/`vh`
 * match that artboard (same behavior as before the static-canvas experiments).
 */
export function HomeScene() {
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

  const scale = `100vh / ${REF_PAGE_HEIGHT}`;
  const inset = `calc(${REF_INSET} * ${scale})`;
  const frameW = `calc(${IMG_W} * ${scale})`;
  const frameH = `calc(${IMG_H} * ${scale})`;
  const nzeribeW = `calc(${NZERIBE_IMG_W} * ${scale})`;
  const nzeribeH = `calc(${NZERIBE_IMG_H} * ${scale})`;
  const gapBioNzeribe = `calc(${ABOUT_GAP_FROM_WEBP_PX} * (${scale}))`;
  const aboutBioRight = `calc(${REF_INSET} * ${scale} + ${IMG_W} * ${scale} + ${ABOUT_GAP_FROM_WEBP_PX}px)`;

  const isContact = activeLabel === "contact";
  const showAboutBio = activeLabel === "about" || isContact;
  const fadeMs = reduceMotion ? 80 : 520;

  return (
    <div
      className={`fixed inset-0 transition-colors duration-300 ${isContact ? "bg-black" : "bg-white"}`}
    >
      <CircularNavWheel
        initialActiveLabel="contact"
        onActiveLabelChange={setActiveLabel}
        onHoverLabelChange={setHoverNavLabel}
      />
      <DesignCluster visible={activeLabel === "design"} />
      <InstallationLottie visible={activeLabel === "installation"} />
      <PhotosHoverCluster visible={hoverNavLabel === "photos"} />
      <FilmHoverGif visible={hoverNavLabel === "film"} />
      <SelectedWorksHoverGif visible={hoverNavLabel === "selected works"} />
      <ContactTopLinks visible={isContact} top={inset} right={aboutBioRight} />
      <div
        aria-hidden={!showAboutBio}
        className="pointer-events-none fixed z-[30] flex flex-row items-end"
        style={{
          left: BIO_GROUP_LEFT,
          right: inset,
          bottom: inset,
          gap: gapBioNzeribe,
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
        <div
          className="pointer-events-none shrink-0 select-none"
          style={{
            width: nzeribeW,
            height: nzeribeH,
          }}
        >
          <Image
            src="/nzeribe1.webp"
            alt="Nzeribe"
            width={NZERIBE_IMG_W}
            height={NZERIBE_IMG_H}
            className="block h-full w-full object-contain object-right object-bottom"
            sizes={`${NZERIBE_IMG_W}px`}
          />
        </div>
      </div>
      <div
        className="fixed z-[2] select-none"
        style={{
          top: inset,
          right: inset,
          width: frameW,
          height: frameH,
        }}
      >
        <Image
          src="/muna-polaroid.webp"
          alt="Muna"
          fill
          className="object-contain object-right object-top"
          sizes="34vw"
          priority
        />
      </div>
    </div>
  );
}
