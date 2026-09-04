"use client";

import {
  ProjectColorPalette,
  type PaletteSwatch,
} from "@/components/project/ProjectColorPalette";

/**
 * DOC NOW 2025 — muted → deepest (soft greys first, then richer midtones, charcoal last).
 */
export const DOC_NOW_SWATCHES: readonly PaletteSwatch[] = [
  { id: "sand", name: "Warm Sand", hex: "#DDCDAC" },
  { id: "sage", name: "Sage Mist", hex: "#A2B3A9" },
  { id: "teal", name: "Dusty Teal", hex: "#87A9AB" },
  { id: "gold", name: "Golden Yellow", hex: "#E9C53D" },
  { id: "orange", name: "Burnt Orange", hex: "#D97B3F" },
  { id: "forest", name: "Forest Green", hex: "#688F60" },
  { id: "charcoal", name: "Deep Charcoal", hex: "#1A221F" },
] as const;

export function DocNowColorsSection() {
  return (
    <ProjectColorPalette
      swatches={DOC_NOW_SWATCHES}
      ariaLabel="DOC NOW 2025 color palette"
      idPrefix="doc-now-swatch"
    />
  );
}
