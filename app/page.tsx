"use client";

import Image from "next/image";
import { useState } from "react";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { AboutBio } from "@/components/AboutBio";
import { ContactTopLinks } from "@/components/ContactTopLinks";
import { DesignCluster } from "@/components/DesignCluster";

/** Layout baseline: image frames 544×659, inset 100, at this viewport height */
const REF_PAGE_HEIGHT = 1624;
const REF_INSET = 100;
/**
 * Nzeribe frame: `bottom` is inset minus how far it bleeds past the viewport bottom
 * (all scaled by viewport height ÷ 1624). Negative bleed = sit lower / extend off-screen.
 */
const NZERIBE_BOTTOM_INSET = 0;
const NZERIBE_PAST_BOTTOM_REF = 160;
const IMG_W = 544;
const IMG_H = 659;
/** Space between about bio text block and Nzeribe frame (horizontal). */
const ABOUT_GAP_FROM_WEBP_PX = 20;

export default function HomePage() {
  const [activeLabel, setActiveLabel] = useState("contact");
  const scale = `100vh / ${REF_PAGE_HEIGHT}`;
  const inset = `calc(${REF_INSET} * ${scale})`;
  const nzeribeBottom = `calc((${NZERIBE_BOTTOM_INSET} - ${NZERIBE_PAST_BOTTOM_REF}) * ${scale})`;
  const frameW = `calc(${IMG_W} * ${scale})`;
  const frameH = `calc(${IMG_H} * ${scale})`;
  /** Right edge of bio: viewport right minus inset, image column, and gap — aligns bottom with Nzeribe frame. */
  const aboutBioRight = `calc(${REF_INSET} * ${scale} + ${IMG_W} * ${scale} + ${ABOUT_GAP_FROM_WEBP_PX}px)`;

  const isContact = activeLabel === "contact";
  const showAboutBio = activeLabel === "about" || isContact;

  return (
    <div
      className={`fixed inset-0 transition-colors duration-300 ${isContact ? "bg-black" : "bg-white"}`}
    >
      <CircularNavWheel
        initialActiveLabel="contact"
        onActiveLabelChange={setActiveLabel}
      />
      <DesignCluster visible={activeLabel === "design"} />
      <ContactTopLinks visible={isContact} top={inset} right={aboutBioRight} />
      <AboutBio
        visible={showAboutBio}
        whiteBodyText={isContact}
        alignBottom={nzeribeBottom}
        alignRight={aboutBioRight}
      />
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
      <div
        className="fixed z-[2] select-none"
        style={{
          bottom: nzeribeBottom,
          right: inset,
          width: frameW,
          height: frameH,
        }}
      >
        <Image
          src="/nzeribe1.webp"
          alt="Nzeribe"
          fill
          className="object-contain object-right object-bottom"
          sizes="34vw"
        />
      </div>
    </div>
  );
}
