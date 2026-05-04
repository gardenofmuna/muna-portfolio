"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

type Props = {
  visible: boolean;
};

/**
 * Three “scrapbook” pieces when the wheel highlights “design”.
 */
export function DesignCluster({ visible }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const u = `min(100vw / ${REF_DESIGN_W}, 100vh / ${REF_DESIGN_H})`;
  const at = (n: number) => `calc(${n} * ${u})`;
  const fadeMs = reduceMotion ? 80 : 520;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[40] select-none"
      aria-hidden={!visible}
      style={{
        opacity: visible ? 1 : 0,
        transition: reduceMotion
          ? "none"
          : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        transform: visible ? "translateY(0)" : "translateY(14px)",
      }}
    >
      {/* design-1: 509×567 @ comp origin, ~10° CW */}
      <div
        className="absolute z-[1]"
        style={{
          left: at(D1.x),
          top: at(D1.y),
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

      {/* design-2: 505×505 @ comp origin, ~20° CW */}
      <div
        className="absolute z-[2]"
        style={{
          left: at(D2.x),
          top: at(D2.y),
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

      {/* design-3: 505×505 @ comp origin, ~10° CCW */}
      <div
        className="absolute z-[3]"
        style={{
          left: at(D3.x),
          top: at(D3.y),
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
    </div>
  );
}
