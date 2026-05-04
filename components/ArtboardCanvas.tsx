"use client";

import { useLayoutEffect, useState } from "react";
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/lib/artboard";

type Props = {
  children: React.ReactNode;
};

/**
 * Centers a fixed-size artboard and scales it uniformly (cover) so the window is always filled;
 * overflow is clipped like Photoshop crop — no non-uniform squeeze of layout.
 */
export function ArtboardCanvas({ children }: Props) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const u = () => {
      setScale(
        Math.max(
          window.innerWidth / ARTBOARD_WIDTH,
          window.innerHeight / ARTBOARD_HEIGHT,
        ),
      );
    };
    u();
    window.addEventListener("resize", u);
    return () => window.removeEventListener("resize", u);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#eeece4]">
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="relative shrink-0 [container-type:size]"
          style={{
            width: ARTBOARD_WIDTH,
            height: ARTBOARD_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
          suppressHydrationWarning
        >
          {children}
        </div>
      </div>
    </div>
  );
}
