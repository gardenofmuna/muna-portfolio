"use client";

import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
  NARROW_BIO_FONT_SCALE,
  NARROW_BIO_POPUP_W,
  NARROW_H,
  NARROW_W,
} from "@/lib/narrow-stage";

/** Homepage comp (for scale u) */
const REF_W = 1440;
const REF_H = 811.5;

/** PNG reference — text block 1024×526 at 1:1 */
const PNG_W = 1024;
const PNG_H = 526;

const BOX_TOP_REF = 132;
const TRACKING_EM = -0.05;
const MIN_LEFT_REF = 392;

/**
 * Photoshop Character panel “Auto” leading ≈ 120% of point size (Roman type default).
 */
const PHOTOSHOP_AUTO_LEADING = 1.2;

/** Typography scale vs reference block (nine lines unchanged); +10% twice vs base 0.5. */
const BIO_TEXT_SCALE = 0.5 * 1.1 * 1.1;

/** Pinned `translate(x, y)` from measured drag (Chrome localStorage). */
const ABOUT_BIO_PIN_OFFSET_X = 63.0546875;
const ABOUT_BIO_PIN_OFFSET_Y = -140.7421875;

/** Matches Artboard_5 reference */
const COL = {
  lagos: "#ff7bb5",
  toronto: "#f9b109",
  medium: "#019f4b",
  interdisciplinary: "#fe5418",
  afro: "#5d639f",
  blue: "#488bdc",
} as const;

/**
 * Faux bold without triple ghosts: ±1px `text-shadow` draws fill + 2 offsets (3 stacked impressions).
 * A thin same-color stroke thickens once around the glyph.
 */
function fauxBold(fill: string): CSSProperties {
  return {
    color: fill,
    WebkitTextFillColor: fill,
    WebkitTextStroke: `1px ${fill}`,
    paintOrder: "stroke fill",
  };
}

type Layout = {
  left: number;
  /** Nav-safe left (always `MIN_LEFT_REF` × scale) — use when pinching right against the webp column */
  leftMin: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
};

function layoutForViewport(
  vw: number,
  vh: number,
  options?: {
    fixedAspectBlock?: boolean;
    refW?: number;
    refH?: number;
    maxWidth?: number;
    /** Hub bio: target width (artboard px), capped to viewport width. */
    hubWidth?: number;
    textScale?: number;
  },
): Layout {
  const refW = options?.refW ?? REF_W;
  const refH = options?.refH ?? REF_H;
  const u = Math.min(vw / refW, vh / refH);
  /** Embedded bio: exact1024×526×u — no min-width clamp so lines never reflow like a scaled image. */
  let width = options?.fixedAspectBlock
    ? Math.round(PNG_W * u)
    : Math.max(280, Math.round(PNG_W * u));
  if (options?.hubWidth) {
    width = Math.min(options.hubWidth, vw);
  } else if (options?.maxWidth) {
    width = Math.min(width, options.maxWidth);
  }
  const height = Math.round(width * (PNG_H / PNG_W));
  const top = Math.round(BOX_TOP_REF * u);
  const centeredLeft = Math.round((vw - width) / 2);
  const minLeft = Math.round(MIN_LEFT_REF * u);
  const left = Math.max(minLeft, centeredLeft);
  const lineHeight = PHOTOSHOP_AUTO_LEADING;
  const textScale = options?.textScale ?? 1;
  const fontSize =
    Math.round(
      (height / (9 * PHOTOSHOP_AUTO_LEADING)) *
        BIO_TEXT_SCALE *
        textScale *
        100,
    ) / 100;
  return { left, leftMin: minLeft, top, width, height, fontSize, lineHeight };
}

type Props = {
  visible: boolean;
  /** When true, default body copy is white (contact view); coloured spans unchanged. */
  whiteBodyText?: boolean;
  /**
   * When set, the bio block’s bottom edge matches this offset (e.g. same `bottom` as the Nzeribe frame).
   */
  alignBottom?: string;
  /**
   * When set with `alignBottom`, `right` is pinned so the text stays this far from the viewport’s right edge
   * (inset + image column + gap), `width` is auto, and `left` uses the nav-safe minimum.
   */
  alignRight?: string;
  /**
   * When true, sits in a parent flex row (e.g. with Nzeribe): no fixed positioning; parent handles placement
   * and opacity. Omit `alignBottom` / `alignRight`.
   */
  embedded?: boolean;
  /** Use Artboard_2 (859×1623) scale for typography on narrow layout. */
  narrowStage?: boolean;
  /** Centre bio inside the narrow wheel hub (about / contact). */
  hubCentered?: boolean;
};

/**
 * Nine lines exactly as Artboard_5 (1024×526): same wraps, colors, left alignment.
 */
export function AboutBio({
  visible,
  whiteBodyText,
  alignBottom,
  alignRight,
  embedded = false,
  narrowStage = false,
  hubCentered = false,
}: Props) {
  const stageOpts = narrowStage
    ? { refW: NARROW_W, refH: NARROW_H }
    : undefined;
  const layoutOpts = useMemo(
    () =>
      embedded
        ? {
            fixedAspectBlock: true,
            ...stageOpts,
            ...(hubCentered
              ? {
                  hubWidth: NARROW_BIO_POPUP_W,
                  textScale: NARROW_BIO_FONT_SCALE,
                }
              : {}),
          }
        : stageOpts,
    [embedded, narrowStage, hubCentered],
  );

  const [reduceMotion, setReduceMotion] = useState(false);
  const [layout, setLayout] = useState<Layout>(() =>
    layoutForViewport(1440, 900, layoutOpts),
  );

  useLayoutEffect(() => {
    const read = () => {
      const vw =
        narrowStage && embedded
          ? NARROW_W
          : document.documentElement.clientWidth;
      const vh =
        narrowStage && embedded
          ? NARROW_H
          : document.documentElement.clientHeight;
      setLayout(layoutForViewport(vw, vh, layoutOpts));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(document.documentElement);
    window.addEventListener("resize", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [embedded, narrowStage, layoutOpts]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const fadeMs = reduceMotion ? 80 : 520;
  const { fontSize, lineHeight, width, height, left, leftMin, top } = layout;
  const pinBottom = Boolean(alignBottom && !embedded);
  const pinchRight = Boolean(alignRight && !embedded);
  const bottomAnchored = (pinBottom || embedded) && !hubCentered;
  const contentJustify = hubCentered
    ? "center"
    : bottomAnchored
      ? "flex-end"
      : "flex-start";

  const bodyInk = whiteBodyText ? "#fff" : "#000";

  const textStyle = {
    margin: 0,
    padding: 0,
    fontSize,
    letterSpacing: `${TRACKING_EM}em`,
    lineHeight,
    fontFamily: '"LTC Garamont Display OT", "Times New Roman", serif',
    color: bodyInk,
    textAlign: (hubCentered ? "center" : "left") as "center" | "left",
    whiteSpace: hubCentered ? "normal" : "nowrap",
    ...(hubCentered ? { width: "100%" } : {}),
  } as const;

  const fadeTranslateY = visible ? 0 : 10;
  const pinOffsetX = narrowStage && embedded ? 0 : ABOUT_BIO_PIN_OFFSET_X;
  const pinOffsetY =
    (narrowStage && embedded
      ? 0
      : bottomAnchored
        ? 0
        : ABOUT_BIO_PIN_OFFSET_Y) + fadeTranslateY;

  return (
    <div
      className={
        embedded
          ? "relative z-auto shrink-0 select-none pointer-events-none"
          : "fixed z-[30] cursor-text select-text"
      }
      aria-hidden={!visible}
      style={{
        ...(embedded
          ? {
              WebkitUserSelect: "text",
              userSelect: "text",
              boxSizing: "border-box",
              width: width,
              height: hubCentered ? "auto" : height,
              maxWidth: width,
              flexShrink: 0,
              alignSelf: hubCentered ? "center" : "flex-end",
              ...(hubCentered
                ? {}
                : { aspectRatio: `${PNG_W} / ${PNG_H}` }),
            }
          : {
              left: pinchRight ? leftMin : left,
              ...(pinchRight
                ? { right: alignRight, width: "auto" }
                : { width }),
              ...(pinBottom
                ? { bottom: alignBottom, top: "auto", height: "auto" }
                : { top, height }),
              WebkitUserSelect: "text",
              userSelect: "text",
              opacity: visible ? 1 : 0,
              transition: reduceMotion
                ? "none"
                : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.56, 1)`,
              boxSizing: "border-box",
            }),
        ...(!embedded
          ? {}
          : {
              transition: reduceMotion
                ? "none"
                : `transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.56, 1)`,
            }),
        transform: `translate(${pinOffsetX}px, ${pinOffsetY}px)`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: hubCentered ? "auto" : "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: contentJustify,
          alignItems: hubCentered ? "center" : "stretch",
        }}
      >
        <p style={textStyle}>
          Muna Nzeribe (b. 2001) is a designer and artist born in
        </p>
        <p style={textStyle}>
          <span style={fauxBold(COL.lagos)}>Lagos,</span> Nigeria and currently
          living and working in
        </p>
        <p style={textStyle}>
          <span style={fauxBold(COL.toronto)}>Toronto,</span> Canada. With a
          Bsc. in Mass Communication
        </p>
        <p style={textStyle}>
          (2022) and an MFA in Documentary Media (2025), she sees
        </p>
        <p style={textStyle}>
          her practice as an embodiment of Marshall McLuhan&rsquo;s theory
        </p>
        <p style={textStyle}>
          that{" "}
          <span style={fauxBold(COL.medium)}>
            &lsquo;the medium is the message.&rsquo;
          </span>{" "}
          Utilizing an inherently
        </p>
        <p style={textStyle}>
          <span style={fauxBold(COL.interdisciplinary)}>
            interdisciplinary
          </span>{" "}
          approach and{" "}
          <span style={fauxBold(COL.afro)}>Afro-modernist</span> lens, she
        </p>
        <p style={textStyle}>
          waves her creative wand excited to reveal the{" "}
          <span style={fauxBold(COL.blue)}>hidden</span>
        </p>
        <p style={{ ...textStyle, ...fauxBold(COL.blue) }}>
          correspondence embedded in emerging technology.
        </p>
      </div>
    </div>
  );
}
