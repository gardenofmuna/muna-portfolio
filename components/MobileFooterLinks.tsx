"use client";

import { CONTACT_LINKS } from "@/lib/contact-links";
import {
  NARROW_FOOTER_FONT_PX,
  NARROW_FOOTER_LINK_GAP_PX,
  NARROW_FOOTER_TOP,
} from "@/lib/narrow-stage";

const FAUX_STROKE = "0.85px";
const TRACKING_EM = -0.05;

type Props = {
  /** Contact view: white links on black (no white band). */
  inverted?: boolean;
};

/**
 * Artboard_2 footer — linkedin / insta / email always visible on narrow layout.
 */
export function MobileFooterLinks({ inverted = false }: Props) {
  const ink = inverted ? "#fff" : "#000";
  const stroke = inverted ? "#fff" : "#000";

  const linkBase = {
    fontFamily: '"LTC Garamont Display OT", "Times New Roman", serif',
    fontStyle: "italic" as const,
    fontWeight: 500,
    fontSize: NARROW_FOOTER_FONT_PX,
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
      className="pointer-events-auto absolute z-[35] flex flex-row items-center justify-center"
      style={{
        left: 0,
        right: 0,
        top: NARROW_FOOTER_TOP,
        gap: NARROW_FOOTER_LINK_GAP_PX,
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
