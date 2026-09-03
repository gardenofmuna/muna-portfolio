"use client";

import { CONTACT_LINKS } from "@/lib/contact-links";
import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import {
  NARROW_CHROME_SCREEN_PAD,
  NARROW_FOOTER_FONT_PX,
  NARROW_FOOTER_LINK_GAP_PX,
} from "@/lib/narrow-stage";

const FAUX_STROKE = "0.45px";
const TRACKING_EM = -0.05;

type Props = {
  /** Contact view: white links on black (no white band). */
  inverted?: boolean;
};

/**
 * Quadrant 3 — linkedin / insta / email, a fixed 24px from the viewport bottom.
 */
export function MobileFooterLinks({ inverted = false }: Props) {
  const { u, vw } = useNarrowArtboardMetrics();
  const scale = vw > 0 && u > 0 ? u : 1;
  const ink = inverted ? "#fff" : "#000";
  const stroke = inverted ? "#fff" : "#000";

  const linkBase = {
    fontFamily: '"LTC Garamont Display OT", "Times New Roman", serif',
    fontStyle: "italic" as const,
    fontWeight: 400,
    fontSize: NARROW_FOOTER_FONT_PX * scale,
    lineHeight: 1.15,
    letterSpacing: `${TRACKING_EM}em`,
    color: ink,
    WebkitTextFillColor: ink,
    WebkitTextStroke: `${FAUX_STROKE} ${stroke}`,
    paintOrder: "stroke fill" as const,
  } as const;

  return (
    <nav
      aria-label="Contact links"
      className="pointer-events-auto absolute left-0 right-0 z-[46] flex flex-row items-center justify-center"
      style={{
        bottom: NARROW_CHROME_SCREEN_PAD,
        gap: NARROW_FOOTER_LINK_GAP_PX * scale,
      }}
    >
      {CONTACT_LINKS.map(({ label, href, external }) => (
        <button
          key={href}
          type="button"
          className="cursor-pointer select-text border-none bg-transparent p-0 text-left no-underline outline-offset-4 underline-offset-[0.18em] decoration-1 hover:underline"
          style={{
            ...linkBase,
            textDecorationColor: ink,
          }}
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
