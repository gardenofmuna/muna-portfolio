"use client";

import { useEffect, useState } from "react";

import { CONTACT_LINKS } from "@/lib/contact-links";

/** Matches AboutBio `layoutForViewport` scale u */
const U = "min(100vw / 1440, 100vh / 811.5)";
const LEFT_MIN_FLUID = `calc(392 * ${U})`;
/** Sits below nav arc; slightly larger than prior `30 * u`. */
const FONT_SIZE_FLUID = `calc(36 * ${U})`;
const FONT_SIZE_STAGE = "36px";
/** Faux-bold stroke; matches AboutBio coloured spans. */
const FAUX_STROKE = "1px";
/** Design tracking “-50” → −0.05em (matches AboutBio). */
const TRACKING_EM = -0.05;

type Props = {
  visible: boolean;
  /** Same as polaroid wrapper `top` — text top aligns with polaroid frame top */
  top: string;
  /** Distance from stage/viewport right — should meet the polaroid’s left edge (no gap). */
  right: string;
  /** Stage-locked left edge (layout px). Defaults to fluid 392×U when omitted. */
  left?: string;
  /** Lock typography/position to the desktop stage (no vw/vh). */
  stageLocked?: boolean;
};

export function ContactTopLinks({
  visible,
  top,
  right,
  left,
  stageLocked = false,
}: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const fadeMs = reduceMotion ? 80 : 520;

  const linkBase = {
    fontFamily: '"LTC Garamont Display OT", "Times New Roman", serif',
    fontStyle: "italic" as const,
    fontSize: stageLocked ? FONT_SIZE_STAGE : FONT_SIZE_FLUID,
    lineHeight: 1.15,
    letterSpacing: `${TRACKING_EM}em`,
    color: "#000",
    WebkitTextFillColor: "#000",
    WebkitTextStroke: `${FAUX_STROKE} #000`,
    paintOrder: "stroke fill" as const,
  } as const;

  return (
    <nav
      aria-label="Contact"
      aria-hidden={!visible}
      className={
        stageLocked
          ? "pointer-events-none absolute z-[25] flex flex-row flex-wrap items-start justify-end gap-x-[4em] gap-y-1"
          : "pointer-events-none fixed z-[25] flex flex-row flex-wrap items-start justify-end gap-x-[4em] gap-y-1"
      }
      style={{
        top,
        left: left ?? LEFT_MIN_FLUID,
        right,
        paddingBottom: "0.45em",
        paddingRight: "4px",
        boxSizing: "border-box",
        opacity: visible ? 1 : 0,
        transition: reduceMotion
          ? "none"
          : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {CONTACT_LINKS.map(({ label, href, external }) => (
        <button
          key={href}
          type="button"
          className="contact-top-link cursor-pointer pointer-events-auto select-text border-none bg-transparent p-0 text-left no-underline outline-offset-4 underline-offset-[0.18em] decoration-1 decoration-black hover:underline hover:decoration-black"
          style={linkBase}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey) {
              window.open(href, "_blank", "noopener,noreferrer");
              return;
            }
            if (external) {
              window.open(href, "_blank", "noopener,noreferrer");
            } else {
              window.location.assign(href);
            }
          }}
          onAuxClick={(e) => {
            if (e.button !== 1) return;
            e.preventDefault();
            window.open(href, "_blank", "noopener,noreferrer");
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
