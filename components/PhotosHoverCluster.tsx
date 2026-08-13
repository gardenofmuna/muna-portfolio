"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import { DESKTOP_LAYOUT_H, DESKTOP_LAYOUT_W } from "@/lib/desktop-stage";
import {
  NARROW_CENTER_POPUP_MAX,
  NARROW_PHOTOS_NUDGE_UP_PX,
  NARROW_PHOTOS_POPUP_SCALE,
} from "@/lib/narrow-stage";

const REF_STAGE_W = 1440;
const REF_STAGE_H = 811.5;
const U_STAGE_FLUID = `min(100vw / ${REF_STAGE_W}, 100vh / ${REF_STAGE_H})`;

/** Overall cluster scale vs prior layout (~0.8 ≈ 20% smaller). */
const CLUSTER_SCALE = 0.8;

/** Scaled display width at u = 1 (height follows intrinsic aspect — no mat, no crop). */
const CARD_W_REF_PX = Math.round(300 * CLUSTER_SCALE);
/** Room for fan + rotations (short side × factor), scaled with cluster. */
const CLUSTER_W_REF_PX = Math.round(860 * CLUSTER_SCALE);
const CLUSTER_H_REF_PX = Math.round(300 * 2.2 * CLUSTER_SCALE);
/** Horizontal shift of wing centers from middle (× U_STAGE). */
const FAN_OFFSET_REF_PX = Math.round(CARD_W_REF_PX * 0.46);
/** Extra horizontal spread when cluster is hovered (after intro) (× U_STAGE). */
const FAN_OUT_EXTRA_REF_PX = 64;
/** Intro spread: wings slide from center stack into fan (ms). */
const INTRO_SPREAD_MS = 580;
/** Hover fan-out motion after intro (ms). */
const HOVER_FAN_MS = 420;
const LEFT_ROT = -17;
const RIGHT_ROT = 17;

/** Move cluster up from viewport center (px) — desktop only. */
const CLUSTER_NUDGE_UP_PX = 100;

/** Lift & depth (stacked shadows read as seated prints). */
const SHADOW_BACK =
  "0 14px 32px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)";
const SHADOW_FRONT =
  "0 26px 50px rgba(0, 0, 0, 0.28), 0 12px 28px rgba(0, 0, 0, 0.16), 0 4px 8px rgba(0, 0, 0, 0.1)";

const SRC_W = 3600;
const SRC_H = 2387;

type Props = {
  visible: boolean;
  variant?: "desktop" | "narrow";
  /** Lock sizes to the 1440×811.5 desktop stage (no vw/vh). */
  stageLocked?: boolean;
};

/**
 * When the nav lands on photos: wings ease from a stacked center into the fan; then
 * hover fan-out works as before. Skipped when prefers-reduced-motion.
 */
export function PhotosHoverCluster({
  visible,
  variant = "desktop",
  stageLocked = false,
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fanOut, setFanOut] = useState(false);
  /** True until intro spread runs (wings start at 0 lateral offset). */
  const [introPending, setIntroPending] = useState(true);
  const uStage = stageLocked
    ? Math.min(DESKTOP_LAYOUT_W / REF_STAGE_W, DESKTOP_LAYOUT_H / REF_STAGE_H)
    : null;
  const uStageCss = uStage != null ? String(uStage) : U_STAGE_FLUID;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
    if (!visible) {
      setFanOut(false);
      setIntroPending(true);
      return;
    }
    if (reduceMotion) {
      setIntroPending(false);
      return;
    }
    setIntroPending(true);
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setIntroPending(false));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [visible, reduceMotion]);

  /** After intro spread finishes, use shorter easing for hover fan-out. */
  const [introSpreadDone, setIntroSpreadDone] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIntroSpreadDone(false);
      return;
    }
    if (reduceMotion) {
      setIntroSpreadDone(true);
      return;
    }
    if (introPending) {
      setIntroSpreadDone(false);
      return;
    }
    const t = window.setTimeout(
      () => setIntroSpreadDone(true),
      INTRO_SPREAD_MS + 70,
    );
    return () => window.clearTimeout(t);
  }, [visible, reduceMotion, introPending]);

  const fadeMs = reduceMotion ? 80 : 520;
  const isNarrow = variant === "narrow";
  const clusterScale = isNarrow ? NARROW_PHOTOS_POPUP_SCALE : CLUSTER_SCALE;
  const cardWRef = Math.round(300 * clusterScale);
  const clusterWRef = Math.round(860 * clusterScale);
  const clusterHRef = Math.round(300 * 2.2 * clusterScale);
  const fanOffsetRef = Math.round(cardWRef * 0.46);

  const wingEase = "cubic-bezier(0.22, 1, 0.56, 1)";

  const spreadRefPx = fanOut ? FAN_OUT_EXTRA_REF_PX : 0;
  const baseOffsetPx = introPending ? 0 : fanOffsetRef;
  const wingOffsetPx = baseOffsetPx + spreadRefPx;

  const wingMoveMs = reduceMotion
    ? 0
    : introPending
      ? 0
      : introSpreadDone
        ? HOVER_FAN_MS
        : INTRO_SPREAD_MS;

  const wingTransition = reduceMotion
    ? "none"
    : introPending
      ? "none"
      : `transform ${wingMoveMs}ms ${wingEase}, opacity ${wingMoveMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  const imgW = isNarrow
    ? `${cardWRef}px`
    : uStage != null
      ? `${cardWRef * uStage}px`
      : `calc(${cardWRef} * ${uStageCss})`;
  const dim = (n: number) =>
    isNarrow
      ? `${n}px`
      : uStage != null
        ? `${n * uStage}px`
        : `calc(${n} * ${uStageCss})`;

  const photo = (src: string, alt: string, sizes: string) => (
    <Image
      src={src}
      alt={alt}
      width={SRC_W}
      height={SRC_H}
      draggable={false}
      sizes={sizes}
      className="pointer-events-none block h-auto max-w-none select-none"
      style={{ width: imgW, height: "auto" }}
    />
  );

  const clusterInner = (
    <div
      className={`relative ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{
        width: dim(clusterWRef),
        height: dim(clusterHRef),
        maxWidth: isNarrow
          ? NARROW_CENTER_POPUP_MAX
          : stageLocked
            ? DESKTOP_LAYOUT_W
            : "92vw",
      }}
      onMouseEnter={() => setFanOut(true)}
      onMouseLeave={() => setFanOut(false)}
    >
        <div
          className="absolute bottom-0 left-1/2 z-[1]"
          style={{
            transform: isNarrow
              ? `translateX(calc(-50% - ${wingOffsetPx}px)) rotate(${LEFT_ROT}deg)`
              : uStage != null
                ? `translateX(calc(-50% - ${wingOffsetPx * uStage}px)) rotate(${LEFT_ROT}deg)`
                : `translateX(calc(-50% - ${wingOffsetPx} * ${uStageCss})) rotate(${LEFT_ROT}deg)`,
            transformOrigin: "center bottom",
            boxShadow: SHADOW_BACK,
            transition: wingTransition,
          }}
        >
          {photo(
            "/Muna3-09.jpg",
            "Architectural photo",
            "(max-width: 768px) 36vw, 300px",
          )}
        </div>
        <div
          className="absolute bottom-0 left-1/2 z-[2]"
          style={{
            transform: isNarrow
              ? `translateX(calc(-50% + ${wingOffsetPx}px)) rotate(${RIGHT_ROT}deg)`
              : uStage != null
                ? `translateX(calc(-50% + ${wingOffsetPx * uStage}px)) rotate(${RIGHT_ROT}deg)`
                : `translateX(calc(-50% + ${wingOffsetPx} * ${uStageCss})) rotate(${RIGHT_ROT}deg)`,
            transformOrigin: "center bottom",
            boxShadow: SHADOW_BACK,
            transition: wingTransition,
          }}
        >
          {photo(
            "/Muna3-04.jpg",
            "Portrait photo",
            "(max-width: 768px) 36vw, 300px",
          )}
        </div>
        <div
          className="absolute bottom-0 left-1/2 z-[3]"
          style={{
            transform: `translateX(-50%) translateY(${introPending ? 12 : 0}px)`,
            transformOrigin: "center bottom",
            opacity: introPending ? 0.72 : 1,
            marginBottom: isNarrow
              ? `${Math.round(12 * clusterScale)}px`
              : uStage != null
                ? `${Math.round(12 * clusterScale) * uStage}px`
                : `calc(${Math.round(12 * clusterScale)} * ${uStageCss})`,
            boxShadow: SHADOW_FRONT,
            transition: wingTransition,
          }}
        >
          {photo(
            "/Muna3-25.jpg",
            "Production doorway scene",
            "(max-width: 768px) 40vw, 320px",
          )}
        </div>
    </div>
  );

  const fadeStyle = {
    opacity: visible ? 1 : 0,
    transition: reduceMotion
      ? "none"
      : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.56, 1)`,
    transform: visible
      ? isNarrow
        ? `translateY(-${NARROW_PHOTOS_NUDGE_UP_PX}px)`
        : "translateY(0)"
      : isNarrow
        ? `translateY(${12 - NARROW_PHOTOS_NUDGE_UP_PX}px)`
        : "translateY(12px)",
  } as const;

  if (isNarrow) {
    return (
      <NarrowCenterPopup visible={visible} style={fadeStyle}>
        <div aria-label="Photos preview">{clusterInner}</div>
      </NarrowCenterPopup>
    );
  }

  return (
    <div
      className={
        stageLocked
          ? "pointer-events-none absolute inset-0 z-[40] select-none"
          : "pointer-events-none fixed inset-0 z-[40] select-none"
      }
      aria-hidden={!visible}
      style={fadeStyle}
    >
      <div
        className={`absolute left-1/2 top-1/2 ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{
          transform: `translate(-50%, calc(-50% - ${CLUSTER_NUDGE_UP_PX}px))`,
        }}
        aria-label="Photos preview"
      >
        {clusterInner}
      </div>
    </div>
  );
}
