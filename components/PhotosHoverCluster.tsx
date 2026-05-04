"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const REF_STAGE_W = 1440;
const REF_STAGE_H = 811.5;
const U_STAGE = `min(100vw / ${REF_STAGE_W}, 100vh / ${REF_STAGE_H})`;

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

/** Move cluster up from viewport center (px). */
const CLUSTER_NUDGE_UP_PX = 100;

/** Lift & depth (stacked shadows read as seated prints). */
const SHADOW_BACK =
  "0 14px 32px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)";
const SHADOW_FRONT =
  "0 26px 50px rgba(0, 0, 0, 0.28), 0 12px 28px rgba(0, 0, 0, 0.16), 0 4px 8px rgba(0, 0, 0, 0.1)";

const SRC_W = 3600;
const SRC_H = 2387;

type Props = { visible: boolean };

/**
 * When the nav lands on photos: wings ease from a stacked center into the fan; then
 * hover fan-out works as before. Skipped when prefers-reduced-motion.
 */
export function PhotosHoverCluster({ visible }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fanOut, setFanOut] = useState(false);
  /** True until intro spread runs (wings start at 0 lateral offset). */
  const [introPending, setIntroPending] = useState(true);

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

  const wingEase = "cubic-bezier(0.22, 1, 0.56, 1)";

  const spreadRefPx = fanOut ? FAN_OUT_EXTRA_REF_PX : 0;
  const baseOffsetPx = introPending ? 0 : FAN_OFFSET_REF_PX;
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
  const imgW = `calc(${CARD_W_REF_PX} * (${U_STAGE}))`;

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

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[40] select-none"
      aria-hidden={!visible}
      style={{
        opacity: visible ? 1 : 0,
        transition: reduceMotion
          ? "none"
          : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.56, 1)`,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <div
        className={`absolute left-1/2 top-1/2 ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{
          transform: `translate(-50%, calc(-50% - ${CLUSTER_NUDGE_UP_PX}px))`,
        }}
        aria-label="Photos preview"
      >
        <div
          className="relative"
          style={{
            width: `calc(${CLUSTER_W_REF_PX} * (${U_STAGE}))`,
            height: `calc(${CLUSTER_H_REF_PX} * (${U_STAGE}))`,
            maxWidth: "92vw",
          }}
          onMouseEnter={() => setFanOut(true)}
          onMouseLeave={() => setFanOut(false)}
        >
        <div
          className="absolute bottom-0 left-1/2 z-[1]"
          style={{
            transform: `translateX(calc(-50% - ${wingOffsetPx} * (${U_STAGE}))) rotate(${LEFT_ROT}deg)`,
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
            transform: `translateX(calc(-50% + ${wingOffsetPx} * (${U_STAGE}))) rotate(${RIGHT_ROT}deg)`,
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
            marginBottom: `calc(${Math.round(12 * CLUSTER_SCALE)} * (${U_STAGE}))`,
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
      </div>
    </div>
  );
}
