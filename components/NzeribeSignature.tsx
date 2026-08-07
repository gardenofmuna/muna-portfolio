"use client";

import Image from "next/image";

import {
  getDesktopCanvasMetrics,
  NZERIBE_IMG_H,
  NZERIBE_IMG_W,
} from "@/lib/desktop-canvas";

type Props = {
  className?: string;
};

/**
 * Canonical nzeribe wordmark — fixed bottom-right inset matches landing page.
 * Used by both DesktopSiteShell and DesktopProjectShell.
 */
export function NzeribeSignature({ className = "" }: Props) {
  const m = getDesktopCanvasMetrics();

  return (
    <div
      className={`pointer-events-none fixed z-[30] shrink-0 select-none ${className}`.trim()}
      style={{
        bottom: m.inset,
        right: m.inset,
        width: m.nzeribeW,
        height: m.nzeribeH,
      }}
    >
      <Image
        src="/nzeribe1.webp"
        alt="Nzeribe"
        width={NZERIBE_IMG_W}
        height={NZERIBE_IMG_H}
        className="block h-full w-full object-contain object-right object-bottom"
        sizes={`${NZERIBE_IMG_W}px`}
      />
    </div>
  );
}
