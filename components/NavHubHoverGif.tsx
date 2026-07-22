"use client";

import { useEffect, useState } from "react";

import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import {
  NARROW_INSTALLATION_POPUP_SCALE,
  NARROW_INSTALLATION_POPUP_W,
} from "@/lib/narrow-stage";

type Props = {
  visible: boolean;
  layout?: "desktop" | "narrow";
  src: string;
  /** Narrow-only scale multiplier (default 1). */
  narrowScaleMultiplier?: number;
};

/** Half of InstallationLottie desktop display scale. */
export const NAV_HUB_HOVER_DESKTOP_SCALE = 0.9 * 0.5;
export const NAV_HUB_HOVER_NARROW_SCALE =
  NARROW_INSTALLATION_POPUP_SCALE * 0.5 * 1.2;

/**
 * Straight, centered hub GIF preview — shared layout for nav hover previews.
 */
export function NavHubHoverGif({
  visible,
  layout = "desktop",
  src,
  narrowScaleMultiplier = 1,
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const fadeMs = reduceMotion ? 80 : 480;
  const fadeStyle = {
    opacity: visible ? 1 : 0,
    transition: reduceMotion
      ? "none"
      : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    transform: visible ? "translateY(0)" : "translateY(12px)",
  } as const;

  const gif = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="block h-auto w-full object-contain"
      draggable={false}
    />
  );

  if (layout === "narrow") {
    return (
      <NarrowCenterPopup visible={visible} style={fadeStyle}>
        <div
          className="pointer-events-none"
          style={{
            width: NARROW_INSTALLATION_POPUP_W,
            maxWidth: "100%",
            maxHeight: "100%",
            transform: `scale(${NAV_HUB_HOVER_NARROW_SCALE * narrowScaleMultiplier})`,
            transformOrigin: "center center",
          }}
        >
          {gif}
        </div>
      </NarrowCenterPopup>
    );
  }

  return (
    <div
      className="pointer-events-none fixed z-[40] select-none"
      aria-hidden={!visible}
      style={{
        top: "50%",
        left: "calc(clamp(220px, min(34vw, 420px), 480px) - 245px)",
        width: "min(1153px, 111vw)",
        maxWidth: "100%",
        transform: visible
          ? `translateY(-50%) scale(${NAV_HUB_HOVER_DESKTOP_SCALE})`
          : `translateY(calc(-50% + 12px)) scale(${NAV_HUB_HOVER_DESKTOP_SCALE * 0.97})`,
        transformOrigin: "center center",
        opacity: visible ? 1 : 0,
        transition: reduceMotion
          ? "none"
          : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      {gif}
    </div>
  );
}
