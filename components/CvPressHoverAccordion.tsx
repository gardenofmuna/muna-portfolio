"use client";

import { useEffect, useState } from "react";

import { PaperFoldAccordion } from "@/components/PaperFoldAccordion";
import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import { NAV_HUB_HOVER_DESKTOP_SCALE } from "@/components/NavHubHoverGif";
import { NARROW_CENTER_POPUP_MAX } from "@/lib/narrow-stage";

type Props = {
  visible: boolean;
  layout?: "desktop" | "narrow";
};

/** CV crease positions at native scan scale (1252 × 1638). */
const CV_PAGE_HEIGHT = 1638;
const CV_PAGE_WIDTH = 1252;
const CV_FOLD_1 = 587.468;
const CV_FOLD_2 = 1205.009;

/** Same base size as ArtistBioAccordion — scaled down via hub fit, not upscaled to 1153px. */
const CV_ACCORDION_WIDTH = 320;
const CV_ACCORDION_SCALE = 1.56;

function accordionOuterSize(width: number, scale: number) {
  const openHeight = Math.round((width / CV_PAGE_WIDTH) * CV_PAGE_HEIGHT);
  return {
    w: width * scale,
    h: openHeight * scale,
  };
}

const ACCORDION_OUTER = accordionOuterSize(CV_ACCORDION_WIDTH, CV_ACCORDION_SCALE);

/** Fit full portrait page inside the narrow hub square without cropping. */
const NARROW_FIT_SCALE = Math.min(
  (NARROW_CENTER_POPUP_MAX * 0.92) / ACCORDION_OUTER.w,
  (NARROW_CENTER_POPUP_MAX * 0.92) / ACCORDION_OUTER.h,
);

/** Slight counter-clockwise tilt — paper resting angled to the left. */
const CV_PAPER_TILT_DEG = -4;

/** Desktop hub scale — 80% larger than other nav hover previews. */
const CV_DESKTOP_SCALE = NAV_HUB_HOVER_DESKTOP_SCALE * 1.8;

/**
 * Hub preview for “cv + press” — appears on nav hover; desktop unfolds on paper hover.
 */
export function CvPressHoverAccordion({
  visible,
  layout = "desktop",
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isPaperHovered, setIsPaperHovered] = useState(false);
  const isDesktop = layout === "desktop";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  /** Keep preview mounted while moving from nav label onto the paper. */
  const showDesktop = visible || isPaperHovered;

  useEffect(() => {
    if (!showDesktop) setIsPaperHovered(false);
  }, [showDesktop]);

  const fadeMs = reduceMotion ? 80 : 480;
  const fadeStyle = {
    opacity: visible ? 1 : 0,
    transition: reduceMotion
      ? "none"
      : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    transform: visible ? "translateY(0)" : "translateY(12px)",
  } as const;

  const fold = (
    <div
      className="relative h-full w-full"
      style={{
        width: ACCORDION_OUTER.w,
        height: ACCORDION_OUTER.h,
        transform: `rotate(${CV_PAPER_TILT_DEG}deg)`,
        transformOrigin: "center center",
        overflow: "visible",
      }}
    >
      <PaperFoldAccordion
        isOpen={isDesktop ? isPaperHovered : visible}
        frontSrc="/cv-front-page.png"
        backSrc="/cv-back-page.png"
        width={CV_ACCORDION_WIDTH}
        scale={CV_ACCORDION_SCALE}
        pageHeight={CV_PAGE_HEIGHT}
        fold1={CV_FOLD_1}
        fold2={CV_FOLD_2}
        reduceMotion={reduceMotion}
      />
    </div>
  );

  if (layout === "narrow") {
    return (
      <NarrowCenterPopup visible={visible} style={fadeStyle}>
        <div
          className="pointer-events-none"
          style={{
            transform: `scale(${NARROW_FIT_SCALE})`,
            transformOrigin: "center center",
          }}
        >
          {fold}
        </div>
      </NarrowCenterPopup>
    );
  }

  const desktopScale = showDesktop
    ? CV_DESKTOP_SCALE
    : CV_DESKTOP_SCALE * 0.97;

  return (
    <div
      className={`fixed z-[50] select-none ${showDesktop ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!showDesktop}
      onMouseEnter={() => setIsPaperHovered(true)}
      onMouseLeave={() => setIsPaperHovered(false)}
      style={{
        top: "50%",
        left: "50%",
        width: ACCORDION_OUTER.w,
        height: ACCORDION_OUTER.h,
        transform: showDesktop
          ? `translate(-50%, -50%) scale(${desktopScale})`
          : `translate(-50%, calc(-50% + 12px)) scale(${desktopScale})`,
        transformOrigin: "center center",
        opacity: showDesktop ? 1 : 0,
        transition: reduceMotion
          ? "none"
          : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      {fold}
    </div>
  );
}
