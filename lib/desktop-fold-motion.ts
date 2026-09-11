/**
 * Shared desktop three-quadrant fold timing.
 * Keep in sync with components/desktop-site-shell.css (--fold-*).
 */

export const DESKTOP_FOLD_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Column / smart-object / signature-mark duration (mark via WAAPI). */
export const DESKTOP_FOLD_DURATION_MS = 640;

/** Nav wheel fade / slide (leads the fold when hiding). */
export const DESKTOP_FOLD_NAV_DURATION_MS = 480;

/** Hide: nav starts first; scale + columns follow. */
export const DESKTOP_FOLD_SCALE_DELAY_HIDE_MS = 100;
/** Open: columns ease slightly after mark starts expanding. */
export const DESKTOP_FOLD_SCALE_DELAY_OPEN_MS = 40;

export const DESKTOP_FOLD_MARK_DELAY_HIDE_MS = 140;
export const DESKTOP_FOLD_MARK_DELAY_OPEN_MS = 0;

/** Open: nav fades in after columns begin recovering. */
export const DESKTOP_FOLD_NAV_DELAY_OPEN_MS = 120;

/** Veil + hamburger appear — match nav lead. */
export const DESKTOP_FOLD_VEIL_MS = 480;

/** Wait for hide fold before scroll-to-section alignment. */
export const DESKTOP_FOLD_SCROLL_ALIGN_DELAY_MS =
  DESKTOP_FOLD_SCALE_DELAY_HIDE_MS + DESKTOP_FOLD_DURATION_MS + 40;
