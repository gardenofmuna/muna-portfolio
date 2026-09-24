"use client";

import { useEffect, useState } from "react";

import { PaperFoldAccordion } from "@/components/PaperFoldAccordion";
import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import { NAV_HUB_HOVER_DESKTOP_SCALE } from "@/components/NavHubHoverGif";
import { NARROW_CENTER_POPUP_MAX } from "@/lib/narrow-stage";

type Props = {
  visible: boolean;
  layout?: "desktop" | "narrow";
  /** Lock position to the desktop stage (absolute, not viewport-fixed). */
  stageLocked?: boolean;
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

/** Desktop hub scale — 80% larger than other nav hover previews, then +30%. */
const CV_DESKTOP_SCALE = NAV_HUB_HOVER_DESKTOP_SCALE * 1.8 * 1.3;

/** Shift desktop preview slightly left of hub centre. */
const CV_DESKTOP_NUDGE_LEFT_PX = 28;

/**
 * Hub preview for “cv + press” — appears on nav hover; desktop starts unfolded and folds on paper hover.
 * Touch / iPad: no sticky hover — hide as soon as the wheel leaves this section.
 */
export function CvPressHoverAccordion({
  visible,
  layout = "desktop",
  stageLocked = false,
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isPaperHovered, setIsPaperHovered] = useState(false);
  /** iPad / touch: hover doesn’t clear when the wheel moves — don’t stick open. */
  const [coarsePointer, setCoarsePointer] = useState(false);
  const isDesktop = layout === "desktop";

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse), (hover: none)");
    const syncMotion = () => setReduceMotion(motion.matches);
    const syncCoarse = () => setCoarsePointer(coarse.matches);
    syncMotion();
    syncCoarse();
    motion.addEventListener("change", syncMotion);
    coarse.addEventListener("change", syncCoarse);
    return () => {
      motion.removeEventListener("change", syncMotion);
      coarse.removeEventListener("change", syncCoarse);
    };
  }, []);

  /**
   * Mouse: keep mounted while moving from the nav label onto the paper.
   * Touch: follow `visible` only so spinning the wheel always dismisses.
   */
  const showDesktop = visible || (!coarsePointer && isPaperHovered);

  useEffect(() => {
    if (!visible && coarsePointer) setIsPaperHovered(false);
  }, [visible, coarsePointer]);

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
        isOpen={isDesktop ? !isPaperHovered : visible}
        layout={layout}
        frontSrc="/cv-front-page.webp"
        backSrc="/cv-back-page.webp"
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
      className={`${stageLocked ? "absolute" : "fixed"} z-[50] select-none ${showDesktop ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!showDesktop}
      onMouseEnter={() => {
        if (!coarsePointer) setIsPaperHovered(true);
      }}
      onMouseLeave={() => setIsPaperHovered(false)}
      onPointerUp={(event) => {
        if (!coarsePointer || event.pointerType === "mouse") return;
        if (!visible) return;
        setIsPaperHovered((open) => !open);
      }}
      style={{
        top: "50%",
        left: "50%",
        width: ACCORDION_OUTER.w,
        height: ACCORDION_OUTER.h,
        transform: showDesktop
          ? `translate(calc(-50% - ${CV_DESKTOP_NUDGE_LEFT_PX}px), -50%) scale(${desktopScale})`
          : `translate(calc(-50% - ${CV_DESKTOP_NUDGE_LEFT_PX}px), calc(-50% + 12px)) scale(${desktopScale})`,
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
