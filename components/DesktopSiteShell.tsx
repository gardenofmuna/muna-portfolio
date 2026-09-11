"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { DesktopStageViewContext } from "@/components/DesktopStageCanvas";
import {
  getDesktopCanvasMetrics,
  getDesktopShellGridStyle,
  NZERIBE_IMG_H,
  NZERIBE_IMG_W,
} from "@/lib/desktop-canvas";
import {
  getDesktopStageMetrics,
  getDesktopStageShellStyle,
  NZERIBE_MARK_M_SRC_W,
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
  /** Opens nav when menuState is hidden (left hamburger). */
  onOpenMenu?: () => void;
  /** Closes nav when menuState is open (right hamburger). */
  onCloseMenu?: () => void;
  /**
   * White focus veil over center + signature. Only true after the hamburger
   * reopens the menu — not when the menu is naturally open at scroll top.
   */
  menuVeil?: boolean;
  /**
   * Collapse nzeribe1.webp to the leading “m” when a design case study is open.
   */
  signatureCompact?: boolean;
  /** When set, bottom-right nzeribe signature navigates home (e.g. exit project). */
  onSignatureClick?: () => void;
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
  onCloseMenu,
  menuVeil = false,
  signatureCompact = false,
  onSignatureClick,
  layout = "fluid",
}: Props) {
  const isStage = layout === "stage";
  const stageView = useContext(DesktopStageViewContext);
  const fluidMetrics = getDesktopCanvasMetrics();
  const stageMetrics = getDesktopStageMetrics();
  const gridStyle = isStage
    ? getDesktopStageShellStyle(menuState, signatureCompact)
    : getDesktopShellGridStyle(menuState);
  const reduceMotion = useReducedMotionPref();
  const showOpenHamburger = menuState === "hidden" && Boolean(onOpenMenu);
  /* Close control only after hamburger reopen (menuVeil), not at natural scroll-top open. */
  const showCloseHamburger =
    menuState === "open" && menuVeil && Boolean(onCloseMenu);

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

  const u = stageView.layoutScreenUnit;
  const fullMarkLayoutW = Math.round(stageMetrics.nzeribeW);
  const fullMarkLayoutH = Math.round(stageMetrics.nzeribeH);
  const compactMarkLayoutW = Math.ceil(
    stageMetrics.nzeribeW * (NZERIBE_MARK_M_SRC_W / NZERIBE_IMG_W),
  );
  const markScreenFullW = Math.round(fullMarkLayoutW * u);
  const markScreenCompactW = Math.round(compactMarkLayoutW * u);
  const markScreenH = Math.round(fullMarkLayoutH * u);
  const markCssRight = Math.round(
    stageView.viewportW -
      (stageView.offsetLeft + (stageView.layoutW - stageMetrics.inset) * u),
  );
  const markCssBottom = Math.round(
    stageView.viewportH -
      (stageView.offsetTop + (stageView.layoutH - stageMetrics.inset) * u),
  );

  const stageMarkStyle = {
    right: markCssRight,
    bottom: markCssBottom,
    ["--mark-full-w" as string]: `${markScreenFullW}px`,
    ["--mark-compact-w" as string]: `${markScreenCompactW}px`,
    ["--mark-h" as string]: `${markScreenH}px`,
  } satisfies CSSProperties;

  const fluidMarkStyle = {
    bottom: fluidMetrics.inset,
    right: fluidMetrics.inset,
    ["--mark-full-w" as string]: fluidMetrics.nzeribeW,
    ["--mark-compact-w" as string]: `calc(${NZERIBE_MARK_M_SRC_W} * ${fluidMetrics.u1624})`,
    ["--mark-h" as string]: fluidMetrics.nzeribeH,
  } satisfies CSSProperties;

  const stageMark = (
    <SignatureMark
      compact={signatureCompact}
      onSignatureClick={onSignatureClick}
      className="desktop-site-shell__signature-mark--chrome"
      style={stageMarkStyle}
    />
  );

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
      data-menu-veil={menuVeil ? "true" : undefined}
      style={gridStyle}
    >
      <div className="desktop-site-shell__nav">
        {showOpenHamburger && (
          <button
            type="button"
            className="desktop-site-shell__menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={false}
            onClick={onOpenMenu}
          >
            <MenuToggleIcon />
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

      {showCloseHamburger && (
        <button
          type="button"
          className="desktop-site-shell__menu-toggle desktop-site-shell__menu-toggle--end"
          aria-label="Close navigation menu"
          aria-expanded={true}
          onClick={onCloseMenu}
        >
          <MenuToggleIcon />
        </button>
      )}

      <div className="desktop-site-shell__center">{center}</div>

      {/* Layout spacer — keeps the three-zone grid; overlays sit on the shell */}
      <aside className="desktop-site-shell__signature" aria-hidden />

      {stageOverlays}

      <div
        className="desktop-site-shell__polaroid"
        data-visible={showPolaroid ? "true" : "false"}
        style={{
          ...polaroidStyle,
          transition: reduceMotion
            ? "none"
            : "opacity 520ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        aria-hidden={!showPolaroid}
      >
        <Image
          src="/muna-polaroid.webp"
          alt={showPolaroid ? "Muna" : ""}
          fill
          className="object-contain object-right object-top"
          sizes={isStage ? `${Math.round(stageMetrics.frameW)}px` : "34vw"}
          priority
        />
      </div>

      {isStage
        ? stageView.chromeEl
          ? createPortal(stageMark, stageView.chromeEl)
          : null
        : (
            <SignatureMark
              compact={signatureCompact}
              onSignatureClick={onSignatureClick}
              style={fluidMarkStyle}
            />
          )}
    </div>
  );
}

function SignatureMark({
  compact,
  onSignatureClick,
  className,
  style,
}: {
  compact: boolean;
  onSignatureClick?: () => void;
  className?: string;
  style: CSSProperties;
}) {
  return (
    <div
      className={["desktop-site-shell__signature-mark", className]
        .filter(Boolean)
        .join(" ")}
      data-compact={compact ? "" : undefined}
      style={style}
      role="img"
      aria-label="Nzeribe"
    >
      {/*
        Real <img>, fixed full size. Parent width + overflow clips to “m”.
        Safari will not reveal a background-image as the box grows.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nzeribe1.webp"
        alt=""
        width={NZERIBE_IMG_W}
        height={NZERIBE_IMG_H}
        className="desktop-site-shell__signature-mark__image"
        draggable={false}
      />
      <button
        type="button"
        className="desktop-site-shell__signature-button"
        data-active={onSignatureClick ? "" : undefined}
        aria-label={onSignatureClick ? "Back to home" : undefined}
        aria-hidden={onSignatureClick ? undefined : true}
        tabIndex={onSignatureClick ? 0 : -1}
        onClick={onSignatureClick}
      />
    </div>
  );
}

function MenuToggleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="107"
      height="74"
      viewBox="0 0 107 74"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        fill="#000"
        d="M0.801,73.857 L0.801,62.195 L106.310,62.195 L106.310,73.857 L0.801,73.857 ZM0.801,31.098 L106.310,31.098 L106.310,42.759 L0.801,42.759 L0.801,31.098 ZM0.801,-0.000 L106.310,-0.000 L106.310,11.661 L0.801,11.661 L0.801,-0.000 Z"
      />
    </svg>
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
