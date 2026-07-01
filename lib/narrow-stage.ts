/** Artboard_2 — mobile + vertical tablet (Figma). */
export const NARROW_W = 859;
export const NARROW_H = 1623;

export const U_NARROW = `min(100vw / ${NARROW_W}, 100vh / ${NARROW_H})`;

/** Bridge 1624-tall desktop assets onto this artboard height. */
export const U_NARROW_1624 = `(${U_NARROW}) * (${NARROW_H} / 1624)`;

export const NARROW_SIDE_INSET = 32;

/** Top-left nzeribe1.webp on Artboard_2 (Figma). */
export const NARROW_NZERIBE = { x: 32, y: 40, w: 328, h: 70 } as const;

/** Top of footer link row (from artboard top). */
export const NARROW_FOOTER_TOP = 1512;
/** Footer link typography + cluster spacing (Artboard_2). */
export const NARROW_FOOTER_FONT_PX = 56;
export const NARROW_FOOTER_LINK_GAP_PX = 120;
/** Gap above footer reserved for bio bottom edge. */
export const NARROW_BIO_FOOTER_GAP = 20;

/** Uniform scale for narrow wheel ring + hub previews (−20%). */
export const NARROW_WHEEL_UI_SCALE = 0.8;

/** Wheel hub — centre of circular nav + popup anchor (middle of artboard). */
export const NARROW_WHEEL_CENTER = {
  x: NARROW_W / 2,
  y: NARROW_H / 2,
} as const;
/**
 * Pixels of ring arc clipped past each artboard edge — keep a thin sliver only.
 * radius = NARROW_W / 2 + this value.
 */
export const NARROW_WHEEL_EDGE_OVERFLOW = 12;
/** Fallback radius before font metrics load (≈ clip target). */
export const NARROW_WHEEL_R = NARROW_W / 2 + NARROW_WHEEL_EDGE_OVERFLOW;

/** Circular nav label typography (Artboard_2 / PS mock): 48pt Arial MT Std Extra Bold. */
export const NARROW_LABEL_FONT_PT = 48;
/** Display scale for narrow ring labels (+50%, then wheel UI scale). */
const NARROW_RING_FONT_SCALE_BASE = 1.81;
export const NARROW_RING_FONT_SCALE =
  NARROW_RING_FONT_SCALE_BASE * NARROW_WHEEL_UI_SCALE;
/** Photoshop tracking VA −100 → −100/1000 em. Do not stretch via textPath lengthAdjust. */
export const NARROW_LABEL_TRACKING_EM = -0.1;
/** @deprecated use NARROW_LABEL_FONT_PT — kept for imports */
export const NARROW_LABEL_FONT_REF = NARROW_LABEL_FONT_PT;
export const NARROW_LABEL_INACTIVE = "#a3a3a3";
export const NARROW_LABEL_ACTIVE = "#000000";

/** Radial depth of label text on the ring (artboard px). */
export const NARROW_LABEL_BAND_PX =
  NARROW_LABEL_FONT_PT * NARROW_RING_FONT_SCALE * (96 / 72);

/** Interior diameter inside the label ring (artboard px). */
export const NARROW_HUB_DIAMETER = Math.round(
  2 * (NARROW_WHEEL_R - NARROW_LABEL_BAND_PX * 0.58),
);

/** Max hover preview size in the wheel hub (~78% of interior). */
export const NARROW_CENTER_POPUP_MAX = Math.round(NARROW_HUB_DIAMETER * 0.78);

/** About/contact bio width inside the wheel hub (artboard px). */
export const NARROW_BIO_POPUP_W = Math.round(
  NARROW_CENTER_POPUP_MAX * 0.88 * 1.5 * 1.2 * 1.4 * 1.5,
);
/** Hub bio type scale (+40%). */
export const NARROW_BIO_FONT_SCALE = 1.4;

/** Per-preview fit scales (desktop reference spans → hub max). */
export const NARROW_DESIGN_CLUSTER_REF_SPAN = 1180;
export const NARROW_PHOTOS_CLUSTER_REF_W = Math.round(860 * 0.8);
export const NARROW_DESIGN_POPUP_SCALE =
  NARROW_CENTER_POPUP_MAX / NARROW_DESIGN_CLUSTER_REF_SPAN;
/** Shift design cluster slightly right of hub centre (artboard px). */
const NARROW_DESIGN_NUDGE_RIGHT_BASE = 40;
export const NARROW_DESIGN_NUDGE_RIGHT_PX = Math.round(
  NARROW_DESIGN_NUDGE_RIGHT_BASE * NARROW_WHEEL_UI_SCALE,
);
export const NARROW_PHOTOS_POPUP_SCALE =
  NARROW_CENTER_POPUP_MAX / NARROW_PHOTOS_CLUSTER_REF_W;
/** Lift photos fan slightly above hub centre (artboard px). */
const NARROW_PHOTOS_NUDGE_UP_BASE = 80;
export const NARROW_PHOTOS_NUDGE_UP_PX = Math.round(
  NARROW_PHOTOS_NUDGE_UP_BASE * NARROW_WHEEL_UI_SCALE,
);
export const NARROW_INSTALLATION_POPUP_W = Math.round(
  NARROW_CENTER_POPUP_MAX * 1.5 * 1.3,
);
/** Narrow installation Lottie scale (width + scale combined). */
export const NARROW_INSTALLATION_POPUP_SCALE =
  1.08 * 1.5 * NARROW_WHEEL_UI_SCALE * 1.15;

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
