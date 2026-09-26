"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import {
  INSTALL_HANDOFF_EASE,
  INSTALL_HANDOFF_MS,
} from "@/lib/installation-layout";
import { useSafari } from "@/lib/safari";
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
  /**
   * Optional override for the dial layer only. Use while a case-study layout
   * must stay `hidden` (stable columns) but the wheel should slide in/out.
   */
  navLayerState?: DesktopMenuState;
  /**
   * Match installation hero FLIP timing (720ms) so the dial slides with the
   * card + meta handoff — both open and close.
   */
  navHandoff?: boolean;
  /** Skip transition (hard cut). Prefer `navHandoff` for installation. */
  navInstant?: boolean;
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
  /** Accessible name for the signature button; defaults to "Back to home". */
  signatureLabel?: string;
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
  navLayerState,
  navHandoff = false,
  navInstant = false,
  onOpenMenu,
  onCloseMenu,
  menuVeil = false,
  signatureCompact = false,
  onSignatureClick,
  signatureLabel = "Back to home",
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
  const layerState = navLayerState ?? menuState;
  const navLayerRef = useRef<HTMLDivElement>(null);
  const safari = useSafari();
  useNavLayerMotion(navLayerRef, layerState, {
    safari,
    reduceMotion,
    navHandoff,
    navInstant,
  });
  /* Match hero FLIP: same ms/ease; slight delay on reveal so it starts with the transform.
     Safari drops that transition when the grid changes in the same frame, so the
     dial is eased on the compositor instead. */
  const navTransition =
    reduceMotion || navInstant || (safari && !navHandoff)
      ? "none"
      : navHandoff
        ? layerState === "open"
          ? `opacity ${INSTALL_HANDOFF_MS}ms ${INSTALL_HANDOFF_EASE} 32ms, transform ${INSTALL_HANDOFF_MS}ms ${INSTALL_HANDOFF_EASE} 32ms`
          : `opacity ${INSTALL_HANDOFF_MS}ms ${INSTALL_HANDOFF_EASE}, transform ${INSTALL_HANDOFF_MS}ms ${INSTALL_HANDOFF_EASE}`
        : layerState === "hidden"
          ? "opacity 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 280ms"
          : "opacity 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s";
  const showOpenHamburger =
    menuState === "hidden" && layerState === "hidden" && Boolean(onOpenMenu);
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
      label={signatureLabel}
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
          ref={navLayerRef}
          className="desktop-site-shell__nav-layer"
          data-menu-state={layerState}
          data-handoff={navHandoff ? "" : undefined}
          data-instant={navInstant ? "" : undefined}
          style={{ transition: navTransition }}
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
              label={signatureLabel}
              style={fluidMarkStyle}
            />
          )}
    </div>
  );
}

function SignatureMark({
  compact,
  onSignatureClick,
  label,
  className,
  style,
}: {
  compact: boolean;
  onSignatureClick?: () => void;
  label: string;
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
        aria-label={onSignatureClick ? label : undefined}
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

const NAV_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** CSS transitions on this layer are dropped when the shell grid changes.
    Hardcoded keyframes: reading computed style after the class commit is
    already the target, so it cannot be the animation's start. */
function useNavLayerMotion(
  ref: RefObject<HTMLDivElement | null>,
  layerState: DesktopMenuState,
  opts: {
    safari: boolean;
    reduceMotion: boolean;
    navHandoff: boolean;
    navInstant: boolean;
  },
) {
  const prevLayer = useRef(layerState);
  const animRef = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const prev = prevLayer.current;
    prevLayer.current = layerState;
    if (!el || !opts.safari || prev === layerState) return;
    if (opts.reduceMotion || opts.navHandoff || opts.navInstant) return;
    animRef.current?.cancel();
    const open = layerState === "open";
    el.style.visibility = "visible";
    const shown = {
      transform: "translate3d(0px, 0px, 0px)",
      opacity: "1",
    };
    const hidden = {
      transform: "translate3d(-120px, 0px, 0px)",
      opacity: "0",
    };
    const anim = el.animate(open ? [hidden, shown] : [shown, hidden], {
      duration: 280,
      easing: NAV_EASE,
      fill: "forwards",
    });
    animRef.current = anim;
    const finish = () => {
      if (animRef.current !== anim) return;
      anim.cancel();
      animRef.current = null;
      el.style.removeProperty("visibility");
    };
    anim.onfinish = finish;
    return () => {
      anim.cancel();
      if (animRef.current === anim) animRef.current = null;
      el.style.removeProperty("visibility");
    };
  }, [layerState, opts.safari, opts.reduceMotion, opts.navHandoff, opts.navInstant, ref]);
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
