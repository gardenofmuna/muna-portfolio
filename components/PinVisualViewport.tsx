"use client";

import { useLayoutEffect } from "react";

import { pinToVisualViewport } from "@/lib/pin-visual-viewport";

export function PinVisualViewport() {
  useLayoutEffect(() => {
    pinToVisualViewport();
    const onChange = () => pinToVisualViewport();
    const vv = window.visualViewport;
    window.addEventListener("pageshow", onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    vv?.addEventListener("resize", onChange);
    vv?.addEventListener("scroll", onChange);
    return () => {
      window.removeEventListener("pageshow", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
      vv?.removeEventListener("resize", onChange);
      vv?.removeEventListener("scroll", onChange);
    };
  }, []);
  return null;
}
