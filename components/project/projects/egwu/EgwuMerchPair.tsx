"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import type { CoverFlowItem } from "@/components/project/CoverFlowCarousel";

const CYCLE_MS = 3800;

type SwapProps = {
  items: readonly CoverFlowItem[];
  ariaLabel: string;
  className: string;
};

function MerchSwapBox({ items, ariaLabel, className }: SwapProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const current = items[active] ?? items[0];

  useEffect(() => {
    if (paused || reduceMotion || items.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, items.length]);

  if (!current) return null;

  return (
    <div
      className={`project-egwu-merch__box ${className}`}
      role="img"
      aria-label={`${ariaLabel}. ${current.alt}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="project-egwu-merch__stage">
        {items.map((item, i) => (
          <div
            key={item.src}
            className={`project-egwu-merch__slide${
              i === active ? " is-active" : ""
            }`}
            aria-hidden={i !== active}
          >
            <Image
              src={item.src}
              alt=""
              fill
              className="project-egwu-merch__image"
              sizes="(max-width: 900px) 92vw, 28vw"
              quality={85}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  shirts: readonly CoverFlowItem[];
  bandanas: readonly CoverFlowItem[];
};

export function EgwuMerchPair({ shirts, bandanas }: Props) {
  return (
    <div className="project-egwu-merch">
      <MerchSwapBox
        items={shirts}
        ariaLabel="EGWÚ Records shirts"
        className="project-egwu-merch__box--shirts"
      />
      <MerchSwapBox
        items={bandanas}
        ariaLabel="EGWÚ Records bandanas"
        className="project-egwu-merch__box--bandanas"
      />
    </div>
  );
}
