/**
 * EGWÚ menu-open type + guides from the user's Photoshop Character panel
 * and Artboard 9 guides (2875×1623, units px, 144 ppi).
 *
 * CSS layout px = master ÷ 2 (DesktopStageCanvas scales ×2).
 * Tracking in CSS = PS tracking ÷ 1000 (em).
 */

export const EGWU_OPEN_GUIDES = {
  contentLeft: 836.6,
  contentRight: 2154,
  signatureLeft: 2229.7,
  top: 63,
  bottom: 1513.714,
  /** Visual guide only — not used as a hard nav clip. */
  navVisual: 760.8,
} as const;

export const EGWU_OPEN_TYPE = {
  numerals: {
    font: "LTC Garamont Display OT",
    sizeMaster: 77.79,
    sizeLayout: 38.895,
    leading: "auto",
    tracking: -80,
    letterSpacingEm: -0.08,
    gapMaster: 62,
    gapLayout: 31,
  },
  title: {
    font: "Arial MT Std Extra Bold (PS label: Arial Bold)",
    sizeMaster: 117.52,
    sizeLayout: 58.76,
    leading: "auto",
    tracking: -40,
    letterSpacingEm: -0.04,
  },
  body: {
    font: "LTC Garamont Display OT",
    sizeMaster: 44,
    sizeLayout: 22,
    leadingMaster: 41.13,
    leadingLayout: 20.565,
    tracking: -20,
    letterSpacingEm: -0.02,
    gapToTagsMaster: 73,
    gapToTagsLayout: 36.5,
  },
  tags: {
    font: "LTC Garamont Display OT",
    sizeMaster: 44,
    sizeLayout: 22,
    leadingMaster: 41.13,
    leadingLayout: 20.565,
    tracking: -20,
    letterSpacingEm: -0.02,
  },
  sectionTitle: {
    font: "Arial MT Std Extra Bold (PS label: Arial Bold)",
    sizeMaster: 78.78,
    sizeLayout: 39.39,
    leadingMaster: 78.78,
    leadingLayout: 39.39,
    tracking: -20,
    letterSpacingEm: -0.02,
  },
} as const;

/** Logo asset boxes from PS (master px). */
export const EGWU_OPEN_LOGOS = {
  vertical: { x: 845, y: 888, w: 500, h: 500 },
  wordmark: { x: 1500, y: 838, w: 446, h: 190 },
  badge: { x: 1500, y: 1119, w: 453, h: 310 },
} as const;

/**
 * Colors / posters / merch / playlist from the 2875×8514 scroll mockup.
 * Hidden master ÷ 2.808 into open-composition layout (logo square 702→500).
 */
export const EGWU_SCROLL_BODY = {
  colors: { w: 561, h: 285 },
  playlist: { w: 449, h: 449 },
  posterStageH: 430,
  posterImgMaxH: 368,
  posterImgMaxW: 294,
  merchStageH: 380,
  merchImgMax: 368,
} as const;
