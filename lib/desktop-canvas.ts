/** Shared desktop landing / project canvas scale (from HomeDesktop artboard). */

import type { CSSProperties } from "react";

export const REF_PAGE_HEIGHT = 1624;
export const REF_STAGE_W = 1440;
export const REF_STAGE_H = 811.5;
export const REF_INSET = 100;
export const IMG_W = 544;
export const IMG_H = 659;
export const NZERIBE_IMG_W = 546;
export const NZERIBE_IMG_H = 117;
export const ABOUT_GAP_FROM_WEBP_PX = 20;

/** Nav-safe left edge for central content (matches AboutBio MIN_LEFT_REF). */
export const PROJECT_PANE_LEFT_OPEN_REF = 392;

/** Right signature column width at artboard (polaroid frame + inset). */
export const SIGNATURE_ZONE_REF = REF_INSET + IMG_W;

export type DesktopCanvasMetrics = {
  uStage: string;
  u1624: string;
  inset: string;
  frameW: string;
  frameH: string;
  nzeribeW: string;
  nzeribeH: string;
  gapScaled: string;
  bioGroupLeft: string;
  aboutBioRight: string;
  bioRightClearOfNzeribe: string;
  projectPaneLeftOpen: string;
  projectPaneLeftClosed: string;
  projectPaneRight: string;
  projectPaneTop: string;
  projectPaneBottom: string;
  navZoneOpen: string;
  navZoneClosed: string;
  signatureZone: string;
  shellInsetTop: string;
  shellInsetBottom: string;
  projectGutterLeftOpen: string;
  projectGutterRight: string;
};

export function getDesktopCanvasMetrics(): DesktopCanvasMetrics {
  const uStage = `min(100vw / ${REF_STAGE_W}, 100vh / ${REF_STAGE_H})`;
  const u1624 = `(${uStage}) * (${REF_STAGE_H} / ${REF_PAGE_HEIGHT})`;
  const inset = `calc(${REF_INSET} * ${u1624})`;
  const frameW = `calc(${IMG_W} * ${u1624})`;
  const frameH = `calc(${IMG_H} * ${u1624})`;
  const nzeribeW = `calc(${NZERIBE_IMG_W} * ${u1624})`;
  const nzeribeH = `calc(${NZERIBE_IMG_H} * ${u1624})`;
  const gapScaled = `calc(${ABOUT_GAP_FROM_WEBP_PX} * ${u1624})`;
  const bioGroupLeft = `calc(${PROJECT_PANE_LEFT_OPEN_REF} * ${uStage})`;
  const aboutBioRight = `calc(${REF_INSET} * ${u1624} + ${IMG_W} * ${u1624} + ${ABOUT_GAP_FROM_WEBP_PX}px)`;
  const bioRightClearOfNzeribe = `calc(${REF_INSET} * ${u1624} + ${NZERIBE_IMG_W} * ${u1624} + ${gapScaled})`;
  /**
   * Equal white gutters on the project page (menu↔page and page↔signature).
   * Nav clip is wider than 392 so long labels like "select works" can finish
   * before the gutter — kept separate from the gutter size so we can widen the
   * clip without growing the white gaps.
   */
  const projectGutter = `calc(72 * ${uStage})`;
  /** Extra width past 392 so the active arc’s longest labels aren’t clipped. */
  const NAV_CLIP_EXTRA_REF = 120;
  const navZoneOpen = `calc(${PROJECT_PANE_LEFT_OPEN_REF + NAV_CLIP_EXTRA_REF} * ${uStage})`;
  const navZoneClosed = inset;
  const signatureZone = `calc(${SIGNATURE_ZONE_REF} * ${u1624})`;
  const projectGutterLeftOpen = projectGutter;
  const projectGutterRight = projectGutter;
  const shellInsetTop = inset;
  const shellInsetBottom = `calc(${REF_INSET} * ${u1624} + ${NZERIBE_IMG_H} * ${u1624} + ${ABOUT_GAP_FROM_WEBP_PX} * ${u1624})`;

  return {
    uStage,
    u1624,
    inset,
    frameW,
    frameH,
    nzeribeW,
    nzeribeH,
    gapScaled,
    bioGroupLeft,
    aboutBioRight,
    bioRightClearOfNzeribe,
    projectPaneLeftOpen: bioGroupLeft,
    projectPaneLeftClosed: inset,
    projectPaneRight: inset,
    projectPaneTop: inset,
    projectPaneBottom: shellInsetBottom,
    navZoneOpen,
    navZoneClosed,
    signatureZone,
    shellInsetTop,
    shellInsetBottom,
    projectGutterLeftOpen,
    projectGutterRight,
  };
}

/**
 * At REF_STAGE_W (1440px): nav ≈392px (27.2%), project ≈726px (50.4%),
 * signature ≈322px (22.4%).
 */
export function getDesktopShellGridStyle(
  menuState: "open" | "hidden" = "open",
): CSSProperties {
  const m = getDesktopCanvasMetrics();
  return {
    ["--nav-zone-width" as string]:
      menuState === "open" ? m.navZoneOpen : m.navZoneClosed,
    ["--signature-zone-width" as string]: m.signatureZone,
    ["--shell-inset-top" as string]: m.shellInsetTop,
    ["--shell-inset-bottom" as string]: m.shellInsetBottom,
    ["--project-gutter-left" as string]:
      menuState === "open" ? m.projectGutterLeftOpen : "0px",
    ["--project-gutter-right" as string]: m.projectGutterRight,
  };
}

/** @deprecated Use getDesktopShellGridStyle */
export const getDesktopProjectGridStyle = getDesktopShellGridStyle;
