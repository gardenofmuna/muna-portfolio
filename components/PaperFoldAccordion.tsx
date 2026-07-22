"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const FOLD_DURATION_MS = 600;

function useIsSafari() {
  const [isSafari, setIsSafari] = useState(false);
  useLayoutEffect(() => {
    const ua = navigator.userAgent;
    setIsSafari(
      (/Safari/.test(ua) && !/Chrome|Chromium|Edg|CriOS|FxiOS/.test(ua)) ||
        /iPhone|iPad|iPod/.test(ua),
    );
  }, []);
  return isSafari;
}

export type PaperFoldAccordionProps = {
  isOpen: boolean;
  frontSrc: string;
  backSrc: string;
  width: number;
  scale?: number;
  pageHeight: number;
  fold1: number;
  fold2: number;
  reduceMotion?: boolean;
  /** When true, fold state follows pointer hover over the page imagery. */
  hoverToOpen?: boolean;
  onHoverOpenChange?: (open: boolean) => void;
};

/**
 * Three-crease paper fold (top + middle + bottom panels) — shared with artist bio logic.
 */
export function PaperFoldAccordion({
  isOpen,
  frontSrc,
  backSrc,
  width,
  scale = 1.56,
  pageHeight,
  fold1,
  fold2,
  reduceMotion = false,
  hoverToOpen = false,
  onHoverOpenChange,
}: PaperFoldAccordionProps) {
  const isSafari = useIsSafari();
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [hoverOpen, setHoverOpen] = useState(false);

  const setHoverOpenState = (next: boolean) => {
    setHoverOpen(next);
    onHoverOpenChange?.(next);
  };

  useEffect(() => {
    const img = new Image();
    img.src = frontSrc;
    img.onload = () =>
      setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
  }, [frontSrc]);

  if (!dimensions) {
    const placeholderH = Math.round(width * 1.3);
    return (
      <div
        className={hoverToOpen ? "relative" : "pointer-events-none"}
        style={{ width, height: placeholderH, borderRadius: 4 }}
      >
        {hoverToOpen ? (
          <div
            aria-hidden
            className="absolute inset-0 z-20"
            onMouseEnter={() => setHoverOpenState(true)}
            onMouseLeave={() => setHoverOpenState(false)}
          />
        ) : null}
      </div>
    );
  }

  const open = hoverToOpen ? hoverOpen : isOpen;
  const foldMs = reduceMotion ? 0 : FOLD_DURATION_MS;
  const topPanelShadow = open
    ? "0 8px 16px rgba(0, 0, 0, 0.10)"
    : "0 -5px 12px rgba(0, 0, 0, 0.20)";
  const middlePanelShadow = open
    ? "0 12px 28px rgba(0, 0, 0, 0.18)"
    : "0 5px 14px rgba(0, 0, 0, 0.14)";
  const openHeight = Math.round((width / dimensions.w) * dimensions.h);
  const panelTopHeight = Math.round(openHeight * (fold1 / pageHeight));
  const panelMiddleHeight = Math.round(openHeight * ((fold2 - fold1) / pageHeight));
  const panelBottomHeight = Math.round(
    openHeight * ((pageHeight - fold2) / pageHeight),
  );

  const scaledWidth = width * scale;
  const scaledHeight = openHeight * scale;
  const renderW = isSafari ? scaledWidth : width;
  const renderH = isSafari ? scaledHeight : openHeight;
  const s = isSafari ? scale : 1;
  const pt = Math.round(panelTopHeight * s);
  const pm = Math.round(panelMiddleHeight * s);
  const pb = Math.round(panelBottomHeight * s);

  return (
    <div
      className={hoverToOpen ? "relative" : "pointer-events-none"}
      style={{
        width: scaledWidth,
        height: scaledHeight,
        perspective: 1200,
        ...(isSafari && { WebkitPerspective: 1200 }),
        borderRadius: 4,
        overflow: "visible",
      }}
    >
      <div
        style={{
          width: renderW,
          height: renderH,
          ...(!isSafari && {
            transform: `scale(${scale})`,
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
          style={{
            position: "relative",
            width: renderW,
            height: renderH,
            transformStyle: "preserve-3d",
            ...(isSafari && { WebkitTransformStyle: "preserve-3d" as const }),
          }}
        >
          {/* TOP PANEL */}
          <div
            style={{
              position: "absolute",
              top: 0,
              width: renderW,
              height: pt,
              transformOrigin: "50% 100%",
              transform: isSafari
                ? open
                  ? "rotateX(0deg) translateZ(0)"
                  : "rotateX(-180deg) translateZ(0)"
                : open
                  ? "rotateX(0deg)"
                  : "rotateX(-180deg)",
              transition: `transform ${foldMs}ms ease, box-shadow ${foldMs}ms ease`,
              transitionDelay: open ? "0ms" : `${foldMs}ms`,
              transformStyle: "preserve-3d",
              ...(isSafari && { WebkitTransformStyle: "preserve-3d" as const }),
              zIndex: 3,
              boxShadow: topPanelShadow,
            }}
          >
            {isSafari && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: Math.round(6 * s),
                  backgroundImage: `url(${frontSrc})`,
                  backgroundSize: `${renderW}px ${renderH}px`,
                  backgroundPosition: `0 ${-(pt - Math.round(6 * s))}px`,
                  backgroundRepeat: "no-repeat",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${frontSrc})`,
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: "0 0",
                ...(isSafari && {
                  transform: "translateZ(-2px)",
                  WebkitBackfaceVisibility: "hidden" as const,
                }),
                backfaceVisibility: "hidden",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${backSrc})`,
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: "0 0",
                backgroundRepeat: "no-repeat",
                transform: isSafari
                  ? "rotateX(180deg) translateZ(2px) scaleX(-1)"
                  : "rotateX(180deg) scaleX(-1)",
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
                  backgroundImage: `url(${backSrc})`,
                  backgroundSize: `${renderW}px ${renderH}px`,
                  backgroundPosition: "0 0",
                  backgroundRepeat: "no-repeat",
                }}
              />
            ) : null}
          </div>

          {/* MIDDLE PANEL */}
          <div
            style={{
              position: "absolute",
              top: pt,
              width: renderW,
              height: pm,
              backgroundImage: `url(${frontSrc})`,
              backgroundSize: `${renderW}px ${renderH}px`,
              backgroundPosition: `0 ${-pt}px`,
              zIndex: 1,
              boxShadow: middlePanelShadow,
              transition: `box-shadow ${foldMs}ms ease`,
            }}
          />

          {/* BOTTOM PANEL */}
          <div
            style={{
              position: "absolute",
              top: pt + pm,
              width: renderW,
              height: pb,
              transformOrigin: "50% 0%",
              transform: isSafari
                ? open
                  ? "rotateX(0deg) translateZ(0)"
                  : "rotateX(180deg) translateZ(0)"
                : open
                  ? "rotateX(0deg)"
                  : "rotateX(180deg)",
              transition: `transform ${foldMs}ms ease`,
              transitionDelay: open ? `${foldMs}ms` : "0ms",
              transformStyle: "preserve-3d",
              ...(isSafari && { WebkitTransformStyle: "preserve-3d" as const }),
              zIndex: 2,
              overflow: "visible",
            }}
          >
            {isSafari && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: Math.round(6 * s),
                  backgroundImage: `url(${frontSrc})`,
                  backgroundSize: `${renderW}px ${renderH}px`,
                  backgroundPosition: `0 ${-(pt + pm)}px`,
                  backgroundRepeat: "no-repeat",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${frontSrc})`,
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: `0 ${-(pt + pm)}px`,
                ...(isSafari && {
                  transform: "translateZ(-2px)",
                  WebkitBackfaceVisibility: "hidden" as const,
                }),
                backfaceVisibility: "hidden",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${backSrc})`,
                backgroundSize: `${renderW}px ${renderH}px`,
                backgroundPosition: `0 ${-(pt + pm)}px`,
                backgroundRepeat: "no-repeat",
                transform: isSafari
                  ? "rotateX(180deg) translateZ(2px) scaleX(-1)"
                  : "rotateX(180deg) scaleX(-1)",
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
                  backgroundImage: `url(${backSrc})`,
                  backgroundSize: `${renderW}px ${renderH}px`,
                  backgroundPosition: `0 ${-(pt + pm)}px`,
                  backgroundRepeat: "no-repeat",
                }}
              />
            ) : null}
            {isSafari ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "4%",
                  right: "4%",
                  bottom: -2,
                  height: open ? 14 : 10,
                  pointerEvents: "none",
                  transform: "translateZ(-1px)",
                  background: open
                    ? "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.07) 45%, transparent 100%)"
                    : "linear-gradient(to bottom, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.05) 45%, transparent 100%)",
                  opacity: open ? 1 : 0.7,
                  transition: `opacity ${foldMs}ms ease`,
                }}
              />
            ) : (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "4%",
                  right: "4%",
                  bottom: 0,
                  height: 1,
                  pointerEvents: "none",
                  transform: "translateY(1px) translateZ(-1px)",
                  boxShadow: open
                    ? "0 3px 6px 0 rgba(0,0,0,0.16)"
                    : "0 2px 4px 0 rgba(0,0,0,0.14)",
                  opacity: open ? 1 : 0.7,
                  transition: `box-shadow ${foldMs}ms ease, opacity ${foldMs}ms ease`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      {hoverToOpen ? (
        <div
          aria-hidden
          className="absolute inset-0 z-20"
          onMouseEnter={() => setHoverOpenState(true)}
          onMouseLeave={() => setHoverOpenState(false)}
        />
      ) : null}
    </div>
  );
}
