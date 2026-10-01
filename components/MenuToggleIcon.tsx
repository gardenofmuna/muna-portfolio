"use client";

import { useEffect, useState } from "react";

import "./menu-toggle-icon.css";

type Props = {
  /** X when open, three bars when closed. */
  open: boolean;
  /**
   * Start in the opposite shape and morph on mount — for a button that only
   * exists in one state (the desktop close control) so it still visibly turns.
   */
  morphOnMount?: boolean;
};

/** Hamburger (107×74 master) whose bars cross into an X. */
export function MenuToggleIcon({ open, morphOnMount = false }: Props) {
  const [settled, setSettled] = useState(!morphOnMount);

  useEffect(() => {
    if (settled) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSettled(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [settled]);

  const shownOpen = settled ? open : !open;

  return (
    <svg
      className="menu-toggle-icon"
      data-open={shownOpen ? "" : undefined}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 107 74"
      aria-hidden
    >
      <rect
        className="menu-toggle-icon__bar menu-toggle-icon__bar--top"
        x="0.801"
        y="0"
        width="105.509"
        height="11.661"
      />
      <rect
        className="menu-toggle-icon__bar menu-toggle-icon__bar--mid"
        x="0.801"
        y="31.098"
        width="105.509"
        height="11.661"
      />
      <rect
        className="menu-toggle-icon__bar menu-toggle-icon__bar--bot"
        x="0.801"
        y="62.195"
        width="105.509"
        height="11.661"
      />
    </svg>
  );
}
