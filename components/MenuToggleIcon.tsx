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

/**
 * Hamburger (107×74 master) whose bars cross into an X. Plain boxes rather
 * than SVG shapes: Safari misplaces CSS transforms on SVG children.
 */
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
    <span
      className="menu-toggle-icon"
      data-open={shownOpen ? "" : undefined}
      aria-hidden
    >
      <span className="menu-toggle-icon__bar menu-toggle-icon__bar--top" />
      <span className="menu-toggle-icon__bar menu-toggle-icon__bar--mid" />
      <span className="menu-toggle-icon__bar menu-toggle-icon__bar--bot" />
    </span>
  );
}
