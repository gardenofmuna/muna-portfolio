"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type ProjectMenuState = "open" | "hidden";

type Props = {
  menuState: ProjectMenuState;
  onMenuStateChange: (state: ProjectMenuState) => void;
  children: ReactNode;
};

const SCROLL_HIDE_THRESHOLD = 48;

export function ProjectContentPane({
  menuState,
  onMenuStateChange,
  children,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHidden = menuState === "hidden";

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop > SCROLL_HIDE_THRESHOLD) {
      onMenuStateChange("hidden");
    } else if (el.scrollTop <= 8) {
      onMenuStateChange("open");
    }
  }, [onMenuStateChange]);

  const handleMenuOpen = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    onMenuStateChange("open");
  }, [onMenuStateChange]);

  return (
    <div className="project-pane" data-menu-state={menuState}>
      {isHidden && (
        <button
          type="button"
          className="project-pane__menu-toggle"
          aria-label="Open project menu"
          aria-expanded={false}
          onClick={handleMenuOpen}
        >
          <span className="project-pane__menu-bar" />
          <span className="project-pane__menu-bar" />
          <span className="project-pane__menu-bar" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="project-pane__scroll"
        onScroll={handleScroll}
      >
        <div className="project-pane__inner">{children}</div>
      </div>
    </div>
  );
}

export function ProjectNavLayer({
  menuState,
  children,
}: {
  menuState: ProjectMenuState;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotionPref();

  return (
    <div
      className="project-nav-layer"
      data-menu-state={menuState}
      style={{
        transition: reduceMotion
          ? "none"
          : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </div>
  );
}

function useReducedMotionPref() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduceMotion;
}
