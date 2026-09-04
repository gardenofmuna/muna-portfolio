"use client";

import {
  ProjectColorPalette,
  type PaletteSwatch,
} from "@/components/project/ProjectColorPalette";

/** EGWÚ — Primary muted→deepest, then Secondary muted→deepest. */
export const EGWU_SWATCHES: readonly PaletteSwatch[] = [
  { id: "mint", name: "Soft Mint", group: "Primary", hex: "#92C8A0" },
  { id: "sky", name: "Sky Blue", group: "Primary", hex: "#86CDF2" },
  { id: "peach", name: "Warm Peach", group: "Primary", hex: "#E99B7F" },
  { id: "lavender", name: "Soft Lavender", group: "Primary", hex: "#9994D3" },
  { id: "cream", name: "Warm Cream", group: "Secondary", hex: "#F3E5C0" },
  { id: "rose", name: "Dusty Rose", group: "Secondary", hex: "#D7A1B3" },
  { id: "olive", name: "Sage Olive", group: "Secondary", hex: "#9FAA6B" },
  { id: "orange", name: "Burnt Orange", group: "Secondary", hex: "#D98232" },
] as const;

export function EgwuColorsSection() {
  return (
    <ProjectColorPalette
      swatches={EGWU_SWATCHES}
      ariaLabel="EGWÚ Records color palette"
      idPrefix="egwu-swatch"
      darkInkIds={["cream"]}
    />
  );
}
