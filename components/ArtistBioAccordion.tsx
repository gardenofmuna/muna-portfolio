"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const WIDTH = 320;
const SCALE = 1.56;
const FOLD_DURATION_MS = 600;
/* Real page fold positions (px); proportions used for unequal panels */
const PAGE_HEIGHT = 6566;
const FOLD_1 = 2020;
const FOLD_2 = 4370;

/* Detect Safari for 3D fold fix (avoids backface glitch; Chrome path unchanged). */
function useIsSafari() {
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const value =
      (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) || /iPhone|iPad|iPod/.test(ua);
    const id = setTimeout(() => setIsSafari(value), 0);
    return () => clearTimeout(id);
  }, []);
  return isSafari;
}

/* Top panel opens 0–600ms; bottom panel 600–1200ms → fully flat */
const FULL_UNFOLD_MS = FOLD_DURATION_MS * 2;

export function ArtistBioAccordion() {
  const router = useRouter();
  const aboutClickCountRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [fullyUnfolded, setFullyUnfolded] = useState(false);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const isSafari = useIsSafari();
  const unfoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (unfoldTimerRef.current) {
      clearTimeout(unfoldTimerRef.current);
      unfoldTimerRef.current = null;
    }
    if (!isOpen) {
      setFullyUnfolded(false);
      return;
    }
    unfoldTimerRef.current = setTimeout(() => {
      setFullyUnfolded(true);
      unfoldTimerRef.current = null;
    }, FULL_UNFOLD_MS);
    return () => {
      if (unfoldTimerRef.current) {
        clearTimeout(unfoldTimerRef.current);
        unfoldTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const img = new Image();
    img.src = "/artist-bio-scan.png";
    img.onload = () =>
      setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  if (!dimensions) {
    return (
      <div
        style={{
          width: WIDTH,
          height: 400,
          borderRadius: 4,
        }}
      />
    );
  }

  const openHeight = Math.round((WIDTH / dimensions.w) * dimensions.h);
  const panelTopHeight = Math.round(openHeight * (FOLD_1 / PAGE_HEIGHT));
  const panelMiddleHeight = Math.round(openHeight * ((FOLD_2 - FOLD_1) / PAGE_HEIGHT));
  const panelBottomHeight = Math.round(openHeight * ((PAGE_HEIGHT - FOLD_2) / PAGE_HEIGHT));

  const scaledWidth = WIDTH * SCALE;
  const scaledHeight = openHeight * SCALE;

  /* Safari: render at final size (no scale transform) to avoid blur from nested scaling. */
  const renderW = isSafari ? scaledWidth : WIDTH;
  const renderH = isSafari ? scaledHeight : openHeight;
  const s = isSafari ? SCALE : 1;
  const pt = Math.round(panelTopHeight * s);
  const pm = Math.round(panelMiddleHeight * s);
  const pb = Math.round(panelBottomHeight * s);

  return (
      <div
        data-cursor-artist-bio
        style={{
          width: scaledWidth,
          height: scaledHeight,
          perspective: 1200,
          ...(isSafari && { WebkitPerspective: 1200 }),
          borderRadius: 4,
          overflow: "visible",
          position: "relative",
        }}
      >
      <div
        style={{
          width: renderW,
          height: renderH,
          ...(!isSafari && {
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
            WebkitFilter: "blur(0px)",
            filter: "none",
          }),
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
      <div
        role="presentation"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => {
          setIsOpen(false);
          aboutClickCountRef.current = 0;
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
        }}
      >
        {/* Soft glow only after accordion is fully unfolded */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 11,
            pointerEvents: "none",
            borderRadius: 4,
            opacity: fullyUnfolded ? 1 : 0,
            transition: "opacity 380ms ease",
            boxShadow: fullyUnfolded
              ? "inset 0 0 50px rgba(255, 255, 255, 0.14), 0 0 20px 6px rgba(255, 252, 245, 0.55), 0 0 48px 18px rgba(255, 230, 200, 0.22)"
              : "none",
          }}
        />
        {/* <button> not <a> — avoids browser status-bar / corner link preview on hover */}
        <button
          type="button"
          data-about-nav
          aria-label="About me — double-click or click twice to open"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            /* Keyboard / synthesized click: go straight to About */
            if (e.detail === 0) {
              e.preventDefault();
              aboutClickCountRef.current = 0;
              router.push("/about-me");
              return;
            }
            if (e.detail === 2) {
              e.preventDefault();
              aboutClickCountRef.current = 0;
              router.push("/about-me");
              return;
            }
            if (e.detail === 1) {
              e.preventDefault();
              aboutClickCountRef.current += 1;
              if (aboutClickCountRef.current >= 2) {
                router.push("/about-me");
                aboutClickCountRef.current = 0;
              }
            }
          }}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(27,20,27,0.45)]"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 12,
            cursor: "pointer",
            display: "block",
            border: "none",
            background: "transparent",
            padding: 0,
            margin: 0,
            font: "inherit",
            color: "transparent",
          }}
        >
          <span className="sr-only">About me</span>
        </button>
      </div>

      <div
        style={{
          position: "relative",
          width: renderW,
          height: renderH,
          transformStyle: "preserve-3d",
          ...(isSafari && { WebkitTransformStyle: "preserve-3d" as const }),
        }}
      >
        {/* TOP PANEL – Chrome: panel boxShadow + drop-shadow layer. Safari: translateZ(-2px) so shadow layer stays in front when panel is at -180deg (panel +Z flips away). */}
        <div
          style={{
            position: "absolute",
            top: 0,
            width: renderW,
            height: pt,
            transformOrigin: "50% 100%",
            transform: isSafari
              ? isOpen ? "rotateX(0deg) translateZ(0)" : "rotateX(-180deg) translateZ(0)"
              : isOpen ? "rotateX(0deg)" : "rotateX(-180deg)",
            transition: `transform ${FOLD_DURATION_MS}ms ease, box-shadow ${FOLD_DURATION_MS}ms ease`,
            transitionDelay: isOpen ? "0ms" : `${FOLD_DURATION_MS}ms`,
            transformStyle: "preserve-3d",
            ...(isSafari && { WebkitTransformStyle: "preserve-3d" as const }),
            zIndex: 3,
            ...(!isSafari && { boxShadow: isOpen ? "none" : "1px -2px 6px 0 rgba(0,0,0,0.2)" }),
          }}
        >
          {/* Safari: strip at fold crease (bottom) with paper texture so the line is invisible */}
          {isSafari && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: Math.round(6 * s),
                backgroundImage: "url(/artist-bio-scan.png)",
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: `0 ${-(pt - Math.round(6 * s))}px`,
                backgroundRepeat: "no-repeat",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />
          )}
          {/* front – Safari: translateZ(-2px) so back draws on top; wider Z gap reduces inner fold line */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/artist-bio-scan.png)",
              backgroundSize: `${renderW}px ${renderH}px`,
              backgroundPosition: "0 0",
              ...(isSafari && { transform: "translateZ(-2px)", WebkitBackfaceVisibility: "hidden" as const }),
              backfaceVisibility: "hidden",
            }}
          />
          {/* back – Safari: translateZ(2px) so this draws on top during fold; scaleX(-1) so back image is not mirrored */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: isSafari ? "url(/artist-bio-scan-back-2.png)" : "url(/artist-bio-scan-back.png)",
              backgroundSize: `${renderW}px ${renderH}px`,
              backgroundPosition: "0 0",
              backgroundRepeat: "no-repeat",
              transform: isSafari ? "rotateX(180deg) translateZ(2px) scaleX(-1)" : "rotateX(180deg) scaleX(-1)",
              ...(isSafari && { WebkitBackfaceVisibility: "hidden" as const }),
              backfaceVisibility: "hidden",
            }}
          />
          {isSafari ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: "translateZ(-3px) scaleX(-1)",
                pointerEvents: "none",
                isolation: "isolate",
                backgroundImage: "url(/artist-bio-scan-back-2.png)",
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: "0 0",
                backgroundRepeat: "no-repeat",
                boxShadow: isOpen ? "none" : "1px -2px 6px 0 rgba(0,0,0,0.2)",
                transition: `box-shadow ${FOLD_DURATION_MS}ms ease`,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url(/artist-bio-scan.png)",
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: "0 0",
                pointerEvents: "none",
                opacity: 0.001,
                filter: isOpen ? "none" : "drop-shadow(1px -2px 6px rgba(0,0,0,0.2))",
                transition: `filter ${FOLD_DURATION_MS}ms ease`,
              }}
            />
          )}
        </div>

        {/* MIDDLE PANEL */}
        <div
          style={{
            position: "absolute",
            top: pt,
            width: renderW,
            height: pm,
            backgroundImage: "url(/artist-bio-scan.png)",
            backgroundSize: `${renderW}px ${renderH}px`,
            backgroundPosition: `0 ${-pt}px`,
            zIndex: 1,
          }}
        />

        {/* BOTTOM PANEL – Chrome: panel boxShadow + drop-shadow layer. Safari: translateZ(-3px) so shadow layer stays in front when panel is at 180deg. */}
        <div
          style={{
            position: "absolute",
            top: pt + pm,
            width: renderW,
            height: pb,
            transformOrigin: "50% 0%",
            transform: isSafari
              ? isOpen ? "rotateX(0deg) translateZ(0)" : "rotateX(180deg) translateZ(0)"
              : isOpen ? "rotateX(0deg)" : "rotateX(180deg)",
            transition: `transform ${FOLD_DURATION_MS}ms ease, box-shadow ${FOLD_DURATION_MS}ms ease`,
            transitionDelay: isOpen ? `${FOLD_DURATION_MS}ms` : "0ms",
            transformStyle: "preserve-3d",
            ...(isSafari && { WebkitTransformStyle: "preserve-3d" as const }),
            zIndex: 2,
            ...(!isSafari && { boxShadow: isOpen ? "none" : "1px -2px 6px 0 rgba(0,0,0,0.2)" }),
          }}
        >
          {/* Safari: strip at fold crease (top) with paper texture so the line is invisible */}
          {isSafari && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: Math.round(6 * s),
                backgroundImage: "url(/artist-bio-scan.png)",
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: `0 ${-(pt + pm)}px`,
                backgroundRepeat: "no-repeat",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />
          )}
          {/* front – Safari: translateZ(-2px) so back draws on top; wider Z gap reduces inner fold line */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/artist-bio-scan.png)",
              backgroundSize: `${renderW}px ${renderH}px`,
              backgroundPosition: `0 ${-(pt + pm)}px`,
              ...(isSafari && { transform: "translateZ(-2px)", WebkitBackfaceVisibility: "hidden" as const }),
              backfaceVisibility: "hidden",
            }}
          />
          {/* back – Safari: translateZ(2px) so this draws on top during fold; scaleX(-1) so back image is not mirrored */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: isSafari ? "url(/artist-bio-scan-back-2.png)" : "url(/artist-bio-scan-back.png)",
              backgroundSize: `${renderW}px ${renderH}px`,
              backgroundPosition: `0 ${-(pt + pm)}px`,
              backgroundRepeat: "no-repeat",
              transform: isSafari ? "rotateX(180deg) translateZ(2px) scaleX(-1)" : "rotateX(180deg) scaleX(-1)",
              ...(isSafari && { WebkitBackfaceVisibility: "hidden" as const }),
              backfaceVisibility: "hidden",
            }}
          />
          {isSafari ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: "translateZ(-3px) scaleX(-1)",
                pointerEvents: "none",
                isolation: "isolate",
                backgroundImage: "url(/artist-bio-scan-back-2.png)",
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: `0 ${-(pt + pm)}px`,
                backgroundRepeat: "no-repeat",
                boxShadow: isOpen ? "none" : "1px -2px 6px 0 rgba(0,0,0,0.2)",
                transition: `box-shadow ${FOLD_DURATION_MS}ms ease`,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url(/artist-bio-scan.png)",
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: `0 ${-(pt + pm)}px`,
                pointerEvents: "none",
                opacity: 0.001,
                filter: isOpen ? "none" : "drop-shadow(1px -2px 6px rgba(0,0,0,0.2))",
                transition: `filter ${FOLD_DURATION_MS}ms ease`,
              }}
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}