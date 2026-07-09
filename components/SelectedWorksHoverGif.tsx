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
};

/** Half of InstallationLottie desktop display scale. */
const DESKTOP_DISPLAY_SCALE = 0.9 * 0.5;
const NARROW_DISPLAY_SCALE = NARROW_INSTALLATION_POPUP_SCALE * 0.5 * 1.2;

/**
 * Hub preview when “selected works” is hovered (desktop) or previewed at 12 o'clock (narrow).
 * Straight, centered hub preview at half the installation popup size.
 */
export function SelectedWorksHoverGif({
  visible,
  layout = "desktop",
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
      src="/VHS_PII_MUM.gif"
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
            transform: `scale(${NARROW_DISPLAY_SCALE})`,
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
          ? `translateY(-50%) scale(${DESKTOP_DISPLAY_SCALE})`
          : `translateY(calc(-50% + 12px)) scale(${DESKTOP_DISPLAY_SCALE * 0.97})`,
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
