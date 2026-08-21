/** Artboard_2 — mobile + vertical tablet (Figma). */
export const NARROW_W = 859;
export const NARROW_H = 1623;

/**
 * Uniform zoom on the whole Artboard_2 comp (wordmark, wheel, footer, hub).
 * 1 = letterbox fit; >1 scales up from center like a Photoshop group transform.
 */
export const NARROW_PAGE_SCALE = 1.03;

export const U_NARROW = `(min(100vw / ${NARROW_W}, 100vh / ${NARROW_H})) * ${NARROW_PAGE_SCALE}`;

/** Viewport scale factor for Artboard_2 (px). */
export function narrowArtboardScale(vw: number, vh: number): number {
  return Math.min(vw / NARROW_W, vh / NARROW_H) * NARROW_PAGE_SCALE;
}

/** Bridge 1624-tall desktop assets onto this artboard height. */
export const U_NARROW_1624 = `(${U_NARROW}) * (${NARROW_H} / 1624)`;

export const NARROW_SIDE_INSET = 32;

/** Top-left nzeribe1.webp on Artboard_2 (Figma). */
export const NARROW_NZERIBE = { x: 32, y: 56, w: 328, h: 70 } as const;

/** Fixed CSS-px gap from the mobile viewport left edge to nzeribe1.webp. */
export const NARROW_NZERIBE_SCREEN_LEFT = 24;
/** Fixed CSS-px gap from the viewport top — clears PAGE_SCALE crop on short windows. */
export const NARROW_NZERIBE_SCREEN_TOP = 24;

/**
 * Project narrow wheel peek — Figma state 1 on 859×1623:
 * wheel graphic top 1429 → peek 194 artboard px; graphic width 1016 (enlarged past artboard).
 */
export const NARROW_PROJECT_WHEEL_PEEK = 194;
export const NARROW_PROJECT_WHEEL_GRAPHIC_W = 1016;

/** @deprecated use NARROW_PROJECT_WHEEL_PEEK (artboard px, scale with vw/859) */
export const NARROW_PROJECT_WHEEL_PEEK_PX = NARROW_PROJECT_WHEEL_PEEK;

/** Top of footer link row (from artboard top). */
export const NARROW_FOOTER_TOP = 1492;
/** Footer link typography + cluster spacing (Artboard_2). */
export const NARROW_FOOTER_FONT_PX = 56;
export const NARROW_FOOTER_LINK_GAP_PX = 120;
/** Gap above footer reserved for bio bottom edge. */
export const NARROW_BIO_FOOTER_GAP = 20;

/** Uniform scale for hub preview nudges / installation (relative to wheel interior). */
export const NARROW_WHEEL_UI_SCALE = 0.8;

/** Wheel hub — centre of circular nav + popup anchor (middle of artboard). */
export const NARROW_WHEEL_CENTER = {
  x: NARROW_W / 2,
  y: NARROW_H / 2,
} as const;

/** Legacy mock: ring path sat 12px past each artboard edge before fit. */
const NARROW_WHEEL_DESIGN_OVERFLOW = 12;
const NARROW_WHEEL_DESIGN_R = NARROW_W / 2 + NARROW_WHEEL_DESIGN_OVERFLOW;
const NARROW_RING_FONT_SIZE_PT_DESIGN = 70.5;
const NARROW_LABEL_BAND_DESIGN_PX = NARROW_RING_FONT_SIZE_PT_DESIGN * (96 / 72);
/** Radial typographic overshoot past the path (outside edge of label band). */
const NARROW_LABEL_OUTSET_RATIO = 0.42;
const NARROW_WHEEL_OUTER_R =
  NARROW_WHEEL_DESIGN_R + NARROW_LABEL_BAND_DESIGN_PX * NARROW_LABEL_OUTSET_RATIO;
/** Per-side inset so bold labels are not clipped on real devices (artboard px). */
const NARROW_WHEEL_FIT_INSET_PX = 22;

/**
 * Scales wheel ring + hub previews to fit artboard width edge-to-edge
 * (Photoshop-style uniform scale on the menu group).
 */
export const NARROW_WHEEL_FIT_SCALE =
  (NARROW_W - 2 * NARROW_WHEEL_FIT_INSET_PX) / (2 * NARROW_WHEEL_OUTER_R);
export const NARROW_WHEEL_OUTER_DIAMETER =
  NARROW_W - 2 * NARROW_WHEEL_FIT_INSET_PX;

/** Scale boost so the project peek wheel matches the enlarged Figma crop (1016 / 815). */
export const NARROW_PROJECT_WHEEL_ENLARGE =
  NARROW_PROJECT_WHEEL_GRAPHIC_W / NARROW_WHEEL_OUTER_DIAMETER;

/** @deprecated design overflow — use NARROW_WHEEL_FIT_SCALE; path no longer clips. */
export const NARROW_WHEEL_EDGE_OVERFLOW = 0;
export const NARROW_WHEEL_R = NARROW_WHEEL_DESIGN_R * NARROW_WHEEL_FIT_SCALE;

/** Circular nav label typography (Artboard_2 / PS mock): 48pt Arial MT Std Extra Bold. */
export const NARROW_LABEL_FONT_PT = 48;
/** Display scale reference — ring uses locked NARROW_RING_FONT_SIZE_PT instead. */
const NARROW_RING_FONT_SCALE_BASE = 1.81;
export const NARROW_RING_FONT_SCALE =
  NARROW_RING_FONT_SCALE_BASE * NARROW_WHEEL_UI_SCALE;

/**
 * Locked ring label size — scaled with NARROW_WHEEL_FIT_SCALE so the ring fits width.
 * Design reference: 70.5pt at NARROW_WHEEL_DESIGN_R.
 */
export const NARROW_RING_FONT_SIZE_PT =
  NARROW_RING_FONT_SIZE_PT_DESIGN * NARROW_WHEEL_FIT_SCALE;
/** Locked font: labels span ~this fraction of the full ring path. */
export const NARROW_RING_TEXT_SPAN = 0.965;
/** Photoshop tracking VA −100 → −100/1000 em. Do not stretch via textPath lengthAdjust. */
export const NARROW_LABEL_TRACKING_EM = -0.1;
/** @deprecated use NARROW_LABEL_FONT_PT — kept for imports */
export const NARROW_LABEL_FONT_REF = NARROW_LABEL_FONT_PT;
export const NARROW_LABEL_INACTIVE = "#a3a3a3";
export const NARROW_LABEL_ACTIVE = "#000000";

/** Radial depth of label text on the ring (artboard px). */
export const NARROW_LABEL_BAND_PX =
  NARROW_RING_FONT_SIZE_PT * (96 / 72);

/** Interior diameter inside the label ring (artboard px). */
export const NARROW_HUB_DIAMETER = Math.round(
  2 * (NARROW_WHEEL_R - NARROW_LABEL_BAND_PX * 0.58),
);

/** Max hover preview size in the wheel hub (~78% of interior). */
export const NARROW_CENTER_POPUP_MAX = Math.round(NARROW_HUB_DIAMETER * 0.78);

/** About/contact bio width inside the wheel hub (artboard px). */
export const NARROW_BIO_POPUP_W = Math.round(
  NARROW_CENTER_POPUP_MAX * 0.88 * 1.5 * 1.2 * 1.4 * 1.5 * 0.94,
);
/** Hub bio type scale (+40%, tuned down for hub fit). */
export const NARROW_BIO_FONT_SCALE = 1.28;

/** Per-preview fit scales (desktop reference spans → hub max). */
export const NARROW_DESIGN_CLUSTER_REF_SPAN = 1180;
export const NARROW_PHOTOS_CLUSTER_REF_W = Math.round(860 * 0.8);
export const NARROW_DESIGN_POPUP_SCALE =
  NARROW_CENTER_POPUP_MAX / NARROW_DESIGN_CLUSTER_REF_SPAN;
/** Shift design cluster slightly right of hub centre (artboard px). */
const NARROW_DESIGN_NUDGE_RIGHT_BASE = 40;
export const NARROW_DESIGN_NUDGE_RIGHT_PX = Math.round(
  NARROW_DESIGN_NUDGE_RIGHT_BASE *
    NARROW_WHEEL_UI_SCALE *
    NARROW_WHEEL_FIT_SCALE,
);
export const NARROW_PHOTOS_POPUP_SCALE =
  NARROW_CENTER_POPUP_MAX / NARROW_PHOTOS_CLUSTER_REF_W;
/** Lift photos fan slightly above hub centre (artboard px). */
const NARROW_PHOTOS_NUDGE_UP_BASE = 80;
export const NARROW_PHOTOS_NUDGE_UP_PX = Math.round(
  NARROW_PHOTOS_NUDGE_UP_BASE *
    NARROW_WHEEL_UI_SCALE *
    NARROW_WHEEL_FIT_SCALE,
);
export const NARROW_INSTALLATION_POPUP_W = Math.round(
  NARROW_CENTER_POPUP_MAX * 1.5 * 1.3 * 1.18,
);
/** Narrow installation Lottie scale (width + scale combined). */
export const NARROW_INSTALLATION_POPUP_SCALE =
  1.08 * 1.5 * NARROW_WHEEL_UI_SCALE * 1.15 * NARROW_WHEEL_FIT_SCALE * 1.22;

/** @deprecated use cluster-specific scales above */
export const NARROW_CENTER_POPUP_SCALE = NARROW_DESIGN_POPUP_SCALE;

/** CSS `left` / `top` for wheel hub (popup anchor). */
export const NARROW_HUB_LEFT = `calc(${NARROW_WHEEL_CENTER.x} * (${U_NARROW}))`;
export const NARROW_HUB_TOP = `calc(${NARROW_WHEEL_CENTER.y} * (${U_NARROW}))`;

/** Popup coordinate scale: artboard u × hub scale factor. */
export const U_NARROW_POPUP = `(${U_NARROW}) * ${NARROW_CENTER_POPUP_SCALE}`;

export const NARROW_WHEEL = {
  originXRatio: NARROW_WHEEL_CENTER.x / NARROW_W,
  originYRatio: NARROW_WHEEL_CENTER.y / NARROW_H,
  radiusRatio: NARROW_WHEEL_R / NARROW_W,
  arcOffsetBackPx: 0,
  targetArcSpacingPx: 38,
} as const;
