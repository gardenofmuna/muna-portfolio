import { useSyncExternalStore } from "react";

/** WebKit Safari (macOS, iOS, iPadOS) — not Chrome/Edge posing as Safari. */
export function readSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    (/Safari/.test(ua) && !/Chrome|Chromium|Edg|CriOS|FxiOS/.test(ua)) ||
    /iPhone|iPad|iPod/.test(ua)
  );
}

function subscribeSafari() {
  return () => {};
}

/** Server render is false so the markup matches; the client snapshot updates before paint. */
export function useSafari(): boolean {
  return useSyncExternalStore(subscribeSafari, readSafari, () => false);
}
