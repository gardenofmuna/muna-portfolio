"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { ContactTopLinks } from "@/components/ContactTopLinks";
import { DesignCluster } from "@/components/DesignCluster";
import { InstallationLottie } from "@/components/InstallationLottie";
import { PhotosHoverCluster } from "@/components/PhotosHoverCluster";

/** Layout baseline: image frames 544×659, inset 100, on 1624-tall artboard */
const REF_PAGE_HEIGHT = 1624;
const REF_STAGE_W = 1440;
const REF_STAGE_H = 811.5;
const REF_INSET = 100;
const IMG_W = 544;
const IMG_H = 659;
const NZERIBE_IMG_W = 546;
const NZERIBE_IMG_H = 117;
const ABOUT_GAP_FROM_WEBP_PX = 20;
const U_STAGE = `min(100vw / ${REF_STAGE_W}, 100vh / ${REF_STAGE_H})`;
const U_1624 = `(${U_STAGE}) * (${REF_STAGE_H} / ${REF_PAGE_HEIGHT})`;
const BIO_GROUP_LEFT = `calc(392 * ${U_STAGE})`;

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

  const inset = `calc(${REF_INSET} * ${U_1624})`;
  const frameW = `calc(${IMG_W} * ${U_1624})`;
  const frameH = `calc(${IMG_H} * ${U_1624})`;
  const nzeribeW = `calc(${NZERIBE_IMG_W} * ${U_1624})`;
  const nzeribeH = `calc(${NZERIBE_IMG_H} * ${U_1624})`;
  const gapScaled = `calc(${ABOUT_GAP_FROM_WEBP_PX} * ${U_1624})`;
  const bioRightClearOfNzeribe = `calc(${REF_INSET} * ${U_1624} + ${NZERIBE_IMG_W} * ${U_1624} + ${gapScaled})`;
  const aboutBioRight = `calc(${REF_INSET} * ${U_1624} + ${IMG_W} * ${U_1624} + ${ABOUT_GAP_FROM_WEBP_PX}px)`;

  const isContact = activeLabel === "contact";
  const showAboutBio = activeLabel === "about" || isContact;
  const fadeMs = reduceMotion ? 80 : 520;

  return (
    <div
      className={`fixed inset-0 transition-colors duration-300 ${isContact ? "bg-black" : "bg-white"}`}
    >
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
      <ContactTopLinks visible={isContact} top={inset} right={aboutBioRight} />
      <div
        aria-hidden={!showAboutBio}
        className="pointer-events-none fixed z-[30] flex flex-row items-end"
        style={{
          left: BIO_GROUP_LEFT,
          right: bioRightClearOfNzeribe,
          bottom: inset,
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
      <div
        className="pointer-events-none fixed z-[30] shrink-0 select-none"
        style={{
          bottom: inset,
          right: inset,
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
