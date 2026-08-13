"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  getDesktopCanvasMetrics,
  getDesktopShellGridStyle,
  NZERIBE_IMG_H,
  NZERIBE_IMG_W,
} from "@/lib/desktop-canvas";
import {
  getDesktopStageMetrics,
  getDesktopStageShellStyle,
} from "@/lib/desktop-stage";

import "./desktop-site-shell.css";

export type DesktopMenuState = "open" | "hidden";

type Props = {
  /** Left navigation zone content (typically CircularNavWheel). */
  nav: ReactNode;
  /** Middle zone — landing overlays or project scroll pane. */
  center: ReactNode;
  /**
   * Full-stage overlays in layout coordinates (landing hover/bio/contact).
   * Rendered above the grid so middle-quadrant content can span the artboard
   * while still scaling with DesktopStageCanvas.
   */
  stageOverlays?: ReactNode;
  /** When false, polaroid is omitted (project mode). */
  showPolaroid?: boolean;
  /** Black canvas for contact state on landing page. */
  darkBackground?: boolean;
  /**
   * Controls nav column width. Landing stays `"open"`.
   * Project toggles to `"hidden"` when the middle pane scrolls.
   */
  menuState?: DesktopMenuState;
  /** Shown in the nav zone when menuState is hidden. */
  onOpenMenu?: () => void;
  /**
   * `"fluid"`: viewport-scaled CSS vars (legacy / unused by landing).
   * `"stage"`: locked layout coords inside the 2875×1623 DesktopStageCanvas.
   */
  layout?: "fluid" | "stage";
};

/**
 * Three-zone desktop shell:
 * [ navigation zone ] [ center / project zone ] [ signature zone ]
 */
export function DesktopSiteShell({
  nav,
  center,
  stageOverlays,
  showPolaroid = true,
  darkBackground = false,
  menuState = "open",
  onOpenMenu,
  layout = "fluid",
}: Props) {
  const isStage = layout === "stage";
  const fluidMetrics = getDesktopCanvasMetrics();
  const stageMetrics = getDesktopStageMetrics();
  const gridStyle = isStage
    ? getDesktopStageShellStyle(menuState)
    : getDesktopShellGridStyle(menuState);
  const reduceMotion = useReducedMotionPref();
  const showHamburger = menuState === "hidden" && Boolean(onOpenMenu);

  const polaroidStyle = isStage
    ? {
        top: stageMetrics.inset,
        right: stageMetrics.inset,
        width: stageMetrics.frameW,
        height: stageMetrics.frameH,
      }
    : {
        top: fluidMetrics.inset,
        right: fluidMetrics.inset,
        width: fluidMetrics.frameW,
        height: fluidMetrics.frameH,
      };

  const signatureStyle = isStage
    ? {
        bottom: stageMetrics.inset,
        right: stageMetrics.inset,
        width: stageMetrics.nzeribeW,
        height: stageMetrics.nzeribeH,
      }
    : {
        bottom: fluidMetrics.inset,
        right: fluidMetrics.inset,
        width: fluidMetrics.nzeribeW,
        height: fluidMetrics.nzeribeH,
      };

  return (
    <div
      className={[
        "desktop-site-shell",
        darkBackground ? "desktop-site-shell--dark" : "",
        isStage ? "desktop-site-shell--stage" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-menu-state={menuState}
      style={gridStyle}
    >
      <div className="desktop-site-shell__nav">
        {showHamburger && (
          <button
            type="button"
            className="desktop-site-shell__menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={false}
            onClick={onOpenMenu}
          >
            <span className="desktop-site-shell__menu-bar" />
            <span className="desktop-site-shell__menu-bar" />
            <span className="desktop-site-shell__menu-bar" />
          </button>
        )}
        <div
          className="desktop-site-shell__nav-layer"
          data-menu-state={menuState}
          style={{
            transition: reduceMotion
              ? "none"
              : "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {nav}
        </div>
      </div>

      <div className="desktop-site-shell__center">{center}</div>

      {/* Layout spacer — keeps the three-zone grid; overlays sit on the shell */}
      <aside className="desktop-site-shell__signature" aria-hidden />

      {stageOverlays}

      {showPolaroid && (
        <div className="desktop-site-shell__polaroid" style={polaroidStyle}>
          <Image
            src="/muna-polaroid.webp"
            alt="Muna"
            fill
            className="object-contain object-right object-top"
            sizes={isStage ? `${Math.round(stageMetrics.frameW)}px` : "34vw"}
            priority
          />
        </div>
      )}
      <div
        className="desktop-site-shell__signature-mark"
        style={signatureStyle}
        aria-label="Site signature"
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
    </div>
  );
}

function useReducedMotionPref() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduceMotion;
}
