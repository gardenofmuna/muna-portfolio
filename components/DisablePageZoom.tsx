"use client";

import { useEffect } from "react";

/**
 * Browsers (especially iOS Safari) often ignore viewport user-scalable=false.
 * Block pinch, double-tap, ctrl/trackpad, and keyboard zoom at the document level.
 */
export function DisablePageZoom() {
  useEffect(() => {
    const block = (event: Event) => {
      event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    let lastTouchEnd = 0;
    const onTouchEnd = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 320) event.preventDefault();
      lastTouchEnd = now;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (
        event.key === "+" ||
        event.key === "=" ||
        event.key === "-" ||
        event.key === "_" ||
        event.key === "0"
      ) {
        event.preventDefault();
      }
    };

    const opts: AddEventListenerOptions = { passive: false, capture: true };
    document.addEventListener("wheel", onWheel, opts);
    document.addEventListener("gesturestart", block, opts);
    document.addEventListener("gesturechange", block, opts);
    document.addEventListener("gestureend", block, opts);
    document.addEventListener("touchmove", onTouchMove, opts);
    document.addEventListener("touchend", onTouchEnd, opts);
    document.addEventListener("keydown", onKeyDown, opts);

    return () => {
      document.removeEventListener("wheel", onWheel, opts);
      document.removeEventListener("gesturestart", block, opts);
      document.removeEventListener("gesturechange", block, opts);
      document.removeEventListener("gestureend", block, opts);
      document.removeEventListener("touchmove", onTouchMove, opts);
      document.removeEventListener("touchend", onTouchEnd, opts);
      document.removeEventListener("keydown", onKeyDown, opts);
    };
  }, []);

  return null;
}
