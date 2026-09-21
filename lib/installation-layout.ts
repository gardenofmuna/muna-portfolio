import { INSTALLATION_SHOWS } from "@/data/installation";

/**
 * Photoshop mockup frames on 1167.5×1624.5 → layout.
 * Shared by the landing carousel and the detail smart-object scale.
 */
export const INSTALL_META_W = 260;
export const INSTALL_META_GAP = 28;
/** Hero FLIP + dial slide share this duration / ease. */
export const INSTALL_HANDOFF_MS = 720;
export const INSTALL_HANDOFF_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Landing meta type — year / kind / venue. */
export const INSTALL_META_SIZE = 22.38;
/** Landing title base before fit-to-width. */
export const INSTALL_TITLE_BASE = 36;

const TITLE_CHAR_EM = 0.56;
const TITLE_TRACKING_EM = -0.04;

/**
 * Fit title into the meta column (same math as the carousel) so long lines
 * like “in Your Absence” stay one row and the smart-object FLIP locks.
 */
export function installationTitleFontSize(
  lines: readonly string[],
  metaWidth = INSTALL_META_W,
) {
  const longest = Math.max(...lines.map((line) => line.length), 1);
  const widthEm =
    longest * TITLE_CHAR_EM + Math.max(0, longest - 1) * TITLE_TRACKING_EM;
  return Math.max(22, Math.min(INSTALL_TITLE_BASE, metaWidth / widthEm));
}

const PS = 811.5 / 1624.5;
export const INSTALL_CENTER_W = 1163.095 * PS;
export const INSTALL_CENTER_H = 621 * PS;

/** Fit the photo inside the mockup frame so the card matches its shape. */
export function installationCardSize(
  show: (typeof INSTALLATION_SHOWS)[number],
  scale = 1,
) {
  const maxW = INSTALL_CENTER_W * scale;
  const maxH = INSTALL_CENTER_H * scale;
  const imgAspect = show.width / Math.max(1, show.height);
  const frameAspect = maxW / maxH;
  if (imgAspect >= frameAspect) {
    return { w: maxW, h: maxW / imgAspect };
  }
  return { w: maxH * imgAspect, h: maxH };
}
