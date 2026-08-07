"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { NzeribeSignature } from "@/components/NzeribeSignature";
import { getDesktopCanvasMetrics } from "@/lib/desktop-canvas";

type Props = {
  children: ReactNode;
  /** When false, polaroid frame is omitted (project mode). */
  showPolaroid?: boolean;
  /** Black canvas for contact state on landing page. */
  darkBackground?: boolean;
};

/**
 * Fixed desktop viewport shell shared by the landing page and project pages.
 * Provides polaroid (optional) and nzeribe signature in their canonical positions.
 */
export function DesktopSiteShell({
  children,
  showPolaroid = true,
  darkBackground = false,
}: Props) {
  const m = getDesktopCanvasMetrics();

  return (
    <div
      className={`fixed inset-0 transition-colors duration-300 ${darkBackground ? "bg-black" : "bg-white"}`}
    >
      {children}

      {showPolaroid && (
        <div
          className="fixed z-[2] select-none"
          style={{
            top: m.inset,
            right: m.inset,
            width: m.frameW,
            height: m.frameH,
          }}
        >
          <Image
            src="/muna-polaroid.webp"
            alt="Muna"
            fill
            className="object-contain object-right object-top"
            sizes="34vw"
            priority
          />
        </div>
      )}

      <NzeribeSignature />
    </div>
  );
}
