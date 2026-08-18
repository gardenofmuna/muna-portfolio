/**
 * Fixed desktop poster stage for landing + project pages.
 *
 * MASTER ARTBOARD: 2875 × 1623 (matches References/project-desktop-*.png).
 * Composition is authored in a 1440 × 811.5 layout coordinate system, then
 * uniformly scaled by 2 into the master artboard.
 *
 * Height always fills the viewport so the nav wheel bleeds top/bottom
 * (infinite scroll). Extra width opens the middle/right quadrants. If the
 * window is too narrow (square / squeezed sides), crop horizontally.
 */

import type { CSSProperties } from "react";

/** Master artboard — browser window looks at this poster. */
export const DESKTOP_STAGE_W = 2875;
export const DESKTOP_STAGE_H = 1623;

/**
 * Layout coordinate system inside the master artboard.
 * 1440 × 811.5 × 2 = 2880 × 1623; the 5px width overflow is cropped by the stage.
 */
export const DESKTOP_LAYOUT_W = 1440;
export const DESKTOP_LAYOUT_H = 811.5;
export const DESKTOP_LAYOUT_SCALE = DESKTOP_STAGE_H / DESKTOP_LAYOUT_H; // 2

/** Landing bio / contact row left edge at layout u = 1 (matches prior 392 × U_STAGE). */
export const DESKTOP_LAYOUT_BIO_LEFT = 392;

/** Artboard height used by landing asset frames (polaroid / signature). */
const REF_PAGE_HEIGHT = 1624;
const REF_INSET = 100;
const IMG_W = 544;
const NZERIBE_IMG_W = 546;
const NZERIBE_IMG_H = 117;
const ABOUT_GAP_FROM_WEBP_PX = 20;

/**
 * Content column from Artboard 9 guides (user-measured, artboard-relative).
 * V: 760.8 (visual) | 836.6 (content left) | 2154 (content right) | 2229.7 (signature left)
 *
 * Nav clips at content left (836.6) so wheel ink can run through the ~76px
 * air before the title — not a hard white bar cutting mid-glyph at 760.8.
 * Signature side keeps the measured gutter (2154 → 2229.7).
 */
const MASTER_CONTENT_LEFT = 836.6;
const MASTER_CONTENT_RIGHT = 2154;
const MASTER_SIGNATURE_LEFT = 2229.7;
/** Menu-hidden hamburger column — title/body start at x=301 on the 8514 scroll. */
const MASTER_NAV_HIDDEN = 301;

const FRAME_SCALE_LAYOUT = DESKTOP_LAYOUT_H / REF_PAGE_HEIGHT;

export function desktopStageCoverScale(
  viewportW: number,
  viewportH: number,
): number {
  return Math.max(
    viewportW / DESKTOP_STAGE_W,
    viewportH / DESKTOP_STAGE_H,
  );
}

export function desktopStageContainScale(
  viewportW: number,
  viewportH: number,
): number {
  return Math.min(
    viewportW / DESKTOP_STAGE_W,
    viewportH / DESKTOP_STAGE_H,
  );
}

export const DESKTOP_STAGE_ASPECT = DESKTOP_STAGE_W / DESKTOP_STAGE_H;

export type StageFitMode = "expand" | "fit" | "crop";

/** 16:10 / 3:2 still count as a desktop rectangle (e.g. 13" MacBook 1440×900). */
export const STAGE_DESKTOP_MIN_ASPECT = 1.45;

/** Always fill viewport height so the nav wheel has no top/bottom gap. */
export function desktopStageHeightScale(viewportH: number): number {
  return viewportH > 0 ? viewportH / DESKTOP_STAGE_H : 1;
}

export function desktopStageNaturalWidth(viewportH: number): number {
  return DESKTOP_STAGE_W * desktopStageHeightScale(viewportH);
}

/**
 * expand — window is wide enough: height-fill, extra width opens Q2/Q3.
 * fit — desktop rectangle but not wide enough (13" 16:10): width-fit so the
 *       right padding stays; nav still fills viewport height.
 * crop — too square / squeezed from the sides: height-fill + horizontal crop.
 */
export function desktopStageFitMode(
  viewportW: number,
  viewportH: number,
): StageFitMode {
  if (viewportH <= 0) return "crop";
  const naturalW = desktopStageNaturalWidth(viewportH);
  if (viewportW + 0.5 >= naturalW) return "expand";
  const aspect = viewportW / viewportH;
  if (aspect >= STAGE_DESKTOP_MIN_ASPECT) return "fit";
  return "crop";
}

export type StageLayoutSize = {
  scale: number;
  stageW: number;
  stageH: number;
  layoutW: number;
  layoutH: number;
};

export function desktopStageLayoutSize(
  viewportW: number,
  viewportH: number,
  mode: StageFitMode = desktopStageFitMode(viewportW, viewportH),
): StageLayoutSize {
  if (mode === "fit") {
    const scale = viewportW / DESKTOP_STAGE_W;
    return {
      scale,
      stageW: DESKTOP_STAGE_W,
      stageH: DESKTOP_STAGE_H,
      layoutW: DESKTOP_LAYOUT_W,
      layoutH: DESKTOP_LAYOUT_H,
    };
  }
  const scale = desktopStageHeightScale(viewportH);
  if (mode === "crop") {
    return {
      scale,
      stageW: DESKTOP_STAGE_W,
      stageH: DESKTOP_STAGE_H,
      layoutW: DESKTOP_LAYOUT_W,
      layoutH: DESKTOP_LAYOUT_H,
    };
  }
  const stageW = viewportW / scale;
  return {
    scale,
    stageW,
    stageH: DESKTOP_STAGE_H,
    layoutW: stageW / DESKTOP_LAYOUT_SCALE,
    layoutH: DESKTOP_LAYOUT_H,
  };
}

/** Layout-px height for the nav wheel so it always fills the viewport. */
export function desktopWheelLayoutHeight(
  viewportH: number,
  scale: number,
): number {
  if (scale <= 0) return DESKTOP_LAYOUT_H;
  return viewportH / (DESKTOP_LAYOUT_SCALE * scale);
}

export type StageCropAlignX = "left" | "center" | "right";
export type StageCropAlignY = "top" | "center" | "bottom";

export type WindowFrame = {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
};

export function readWindowFrame(): WindowFrame {
  return {
    screenX: window.screenX,
    screenY: window.screenY,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Crop follows the edge being dragged: resize from the right crops the right
 * (keep left), resize from the left crops the left (keep right). Same for
 * top/bottom. Cover scale is unchanged — only the crop window moves.
 */
export function stageCropAlignFromResize(
  prev: WindowFrame,
  next: WindowFrame,
  currentX: StageCropAlignX,
  currentY: StageCropAlignY,
): { alignX: StageCropAlignX; alignY: StageCropAlignY } {
  const EPS = 1;
  const leftDelta = next.screenX - prev.screenX;
  const topDelta = next.screenY - prev.screenY;
  const rightDelta =
    next.screenX + next.width - (prev.screenX + prev.width);
  const bottomDelta =
    next.screenY + next.height - (prev.screenY + prev.height);

  const leftMoved = Math.abs(leftDelta) >= EPS;
  const rightMoved = Math.abs(rightDelta) >= EPS;
  const topMoved = Math.abs(topDelta) >= EPS;
  const bottomMoved = Math.abs(bottomDelta) >= EPS;

  let alignX = currentX;
  if (leftMoved && !rightMoved) alignX = "right";
  else if (rightMoved && !leftMoved) alignX = "left";
  else if (leftMoved && rightMoved) {
    if (Math.abs(leftDelta) > Math.abs(rightDelta)) alignX = "right";
    else if (Math.abs(rightDelta) > Math.abs(leftDelta)) alignX = "left";
    else alignX = "center";
  }

  let alignY = currentY;
  if (topMoved && !bottomMoved) alignY = "bottom";
  else if (bottomMoved && !topMoved) alignY = "top";
  else if (topMoved && bottomMoved) {
    if (Math.abs(topDelta) > Math.abs(bottomDelta)) alignY = "bottom";
    else if (Math.abs(bottomDelta) > Math.abs(topDelta)) alignY = "top";
    else alignY = "center";
  }

  return { alignX, alignY };
}

export function stageCoverOffset(
  viewportW: number,
  viewportH: number,
  scale: number,
  alignX: StageCropAlignX,
  alignY: StageCropAlignY,
): { left: number; top: number } {
  const scaledW = DESKTOP_STAGE_W * scale;
  const scaledH = DESKTOP_STAGE_H * scale;
  return {
    left:
      alignX === "right"
        ? viewportW - scaledW
        : alignX === "center"
          ? (viewportW - scaledW) / 2
          : 0,
    top:
      alignY === "bottom"
        ? viewportH - scaledH
        : alignY === "center"
          ? (viewportH - scaledH) / 2
          : 0,
  };
}

/**
 * Contain: flush left (nav stays on the window edge), extra width = right
 * padding; extra height split as top/bottom padding.
 */
export function stageContainOffset(
  viewportW: number,
  viewportH: number,
  scale: number,
): { left: number; top: number } {
  return stageCoverOffset(viewportW, viewportH, scale, "left", "center");
}

export type DesktopStageMetrics = {
  inset: number;
  frameW: number;
  frameH: number;
  nzeribeW: number;
  nzeribeH: number;
  gapScaled: number;
  navZoneOpen: number;
  navZoneClosed: number;
  signatureZone: number;
  projectGutter: number;
  projectGutterRight: number;
  shellInsetBottom: number;
};

export function getDesktopStageMetrics(): DesktopStageMetrics {
  const inset = REF_INSET * FRAME_SCALE_LAYOUT;
  const nzeribeW = NZERIBE_IMG_W * FRAME_SCALE_LAYOUT;
  const nzeribeH = NZERIBE_IMG_H * FRAME_SCALE_LAYOUT;
  const gapScaled = ABOUT_GAP_FROM_WEBP_PX * FRAME_SCALE_LAYOUT;
  const gutterRight =
    (MASTER_SIGNATURE_LEFT - MASTER_CONTENT_RIGHT) / DESKTOP_LAYOUT_SCALE;

  return {
    inset,
    frameW: IMG_W * FRAME_SCALE_LAYOUT,
    frameH: 659 * FRAME_SCALE_LAYOUT,
    nzeribeW,
    nzeribeH,
    gapScaled,
    navZoneOpen: MASTER_CONTENT_LEFT / DESKTOP_LAYOUT_SCALE,
    navZoneClosed: MASTER_NAV_HIDDEN / DESKTOP_LAYOUT_SCALE,
    signatureZone: (DESKTOP_STAGE_W - MASTER_SIGNATURE_LEFT) / DESKTOP_LAYOUT_SCALE,
    /** No left white bar — nav paints up to content left. */
    projectGutter: 0,
    projectGutterRight: gutterRight,
    shellInsetBottom: inset + nzeribeH + gapScaled,
  };
}

export function getDesktopStageShellStyle(
  menuState: "open" | "hidden" = "open",
): CSSProperties {
  const m = getDesktopStageMetrics();
  return {
    width: "100%",
    height: "100%",
    ["--nav-zone-width" as string]: `${
      menuState === "open" ? m.navZoneOpen : m.navZoneClosed
    }px`,
    ["--signature-zone-width" as string]: `${m.signatureZone}px`,
    ["--shell-inset-top" as string]: `${m.inset}px`,
    ["--shell-inset-bottom" as string]: `${m.shellInsetBottom}px`,
    /* Gutters stay on the open composition; hidden state scales the object. */
    ["--project-gutter-left" as string]: `${m.projectGutter}px`,
    ["--project-gutter-right" as string]: `${m.projectGutterRight}px`,
  };
}
