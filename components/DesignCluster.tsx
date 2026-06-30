"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import { NARROW_DESIGN_NUDGE_RIGHT_PX, NARROW_DESIGN_POPUP_SCALE } from "@/lib/narrow-stage";

/**
 * Artboard the x/y coords are taken from (adjust if your file uses a different size).
 * 2048×1624 fits x≈2036 and y≈1395 with these assets.
 */
const REF_DESIGN_W = 2048;
const REF_DESIGN_H = 1624;

const DESIGN_SQUARE_PX = 505;
const DESIGN_TALL_W = 509;
const DESIGN_TALL_H = 567;

/** Top-left positions on REF_DESIGN_W × REF_DESIGN_H */
const D1 = { x: 969, y: 212 };
const D2 = { x: 1531, y: 392 };
const D3 = { x: 1016, y: 890 };

/** Visual centroid of the three design pieces on the reference artboard. */
const DESIGN_CLUSTER_PIVOT = { x: 1502, y: 804 } as const;

/** Axis-aligned bbox of pieces relative to DESIGN_CLUSTER_PIVOT (ref px). */
const DESIGN_CLUSTER_BBOX = {
  minX: -533,
  minY: -592,
  width: 1067,
  height: 1183,
} as const;

type Props = {
  visible: boolean;
  variant?: "desktop" | "narrow";
};

function DesignPieces({
  at,
  origin,
}: {
  at: (n: number) => string;
  origin?: { x: number; y: number };
}) {
  const ox = origin?.x ?? 0;
  const oy = origin?.y ?? 0;
  const px = (p: { x: number; y: number }) => ({
    x: p.x - ox,
    y: p.y - oy,
  });
  const p1 = px(D1);
  const p2 = px(D2);
  const p3 = px(D3);
  return (
    <>
      <div
        className="absolute z-[1]"
        style={{
          left: at(p1.x),
          top: at(p1.y),
          width: at(DESIGN_TALL_W),
          height: at(DESIGN_TALL_H),
          transform: "rotate(10deg)",
          transformOrigin: "top left",
        }}
      >
        <div className="relative h-full w-full">
          <Image
            src="/design-1.webp"
            alt="Design work 1"
            fill
            className="object-contain drop-shadow-sm"
            sizes="510px"
          />
        </div>
      </div>
      <div
        className="absolute z-[2]"
        style={{
          left: at(p2.x),
          top: at(p2.y),
          width: at(DESIGN_SQUARE_PX),
          height: at(DESIGN_SQUARE_PX),
          transform: "rotate(20deg)",
          transformOrigin: "top left",
        }}
      >
        <div className="relative h-full w-full">
          <Image
            src="/design-2.webp"
            alt="Design work 2"
            fill
            className="object-contain drop-shadow-sm"
            sizes="505px"
          />
        </div>
      </div>
      <div
        className="absolute z-[3]"
        style={{
          left: at(p3.x),
          top: at(p3.y),
          width: at(DESIGN_SQUARE_PX),
          height: at(DESIGN_SQUARE_PX),
          transform: "rotate(-10deg)",
          transformOrigin: "top left",
        }}
      >
        <div className="relative h-full w-full">
          <Image
            src="/design-3.webp"
            alt="Design work 3"
            fill
            className="object-contain drop-shadow-sm"
            sizes="505px"
          />
        </div>
      </div>
    </>
  );
}

/**
 * Three “scrapbook” pieces when the wheel highlights “design”.
 */
export function DesignCluster({ visible, variant = "desktop" }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const fadeMs = reduceMotion ? 80 : 520;
  const fadeStyle = {
    opacity: visible ? 1 : 0,
    transition: reduceMotion
      ? "none"
      : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    transform: visible
      ? variant === "narrow"
        ? `translateX(${NARROW_DESIGN_NUDGE_RIGHT_PX}px)`
        : "translateY(0)"
      : variant === "narrow"
        ? `translateX(${NARROW_DESIGN_NUDGE_RIGHT_PX}px) translateY(14px)`
        : "translateY(14px)",
  } as const;

  if (variant === "narrow") {
    const s = NARROW_DESIGN_POPUP_SCALE;
    const at = (n: number) => `${n * s}px`;
    const boxW = DESIGN_CLUSTER_BBOX.width * s;
    const boxH = DESIGN_CLUSTER_BBOX.height * s;
    return (
      <NarrowCenterPopup visible={visible} style={fadeStyle}>
        <div className="relative" style={{ width: boxW, height: boxH }}>
          <div
            className="relative"
            style={{
              position: "absolute",
              left: -DESIGN_CLUSTER_BBOX.minX * s,
              top: -DESIGN_CLUSTER_BBOX.minY * s,
              width: 0,
              height: 0,
            }}
          >
            <DesignPieces at={at} origin={DESIGN_CLUSTER_PIVOT} />
          </div>
        </div>
      </NarrowCenterPopup>
    );
  }

  const u = `min(100vw / ${REF_DESIGN_W}, 100vh / ${REF_DESIGN_H})`;
  const at = (n: number) => `calc(${n} * ${u})`;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[40] select-none"
      aria-hidden={!visible}
      style={fadeStyle}
    >
      <DesignPieces at={at} />
    </div>
  );
}
