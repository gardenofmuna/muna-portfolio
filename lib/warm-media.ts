"use client";

import { useEffect, useState } from "react";

/*
 * Hover previews (wheel / nav labels) warm up one at a time once the landing
 * has finished loading, so the first look at each one is instant. Hidden
 * pages' images wait until that's done instead of competing for bandwidth.
 */

const IDLE_DELAY_MS = 400;
const IDLE_TIMEOUT_MS = 1500;
const TASK_TIMEOUT_MS = 6000;
/* Hidden pages load anyway after this, even if a warm task hangs. */
const SETTLE_FALLBACK_MS = 9000;

let idle: Promise<void> | null = null;
let queue: Promise<void> = Promise.resolve();

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function landingIdle(): Promise<void> {
  if (idle) return idle;
  idle = new Promise((resolve) => {
    const go = () => {
      window.setTimeout(() => {
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
        } else {
          resolve();
        }
      }, IDLE_DELAY_MS);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  });
  return idle;
}

/** Run `task` after the landing is idle and every earlier warm task is done. */
export function queueWarm(task: () => Promise<unknown>) {
  queue = queue
    .then(landingIdle)
    .then(() => Promise.race([task().then(() => undefined, () => undefined), wait(TASK_TIMEOUT_MS)]));
}

/** True once the warm queue has drained (or the fallback has passed). */
export function useWarmSettled(): boolean {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setSettled(true);
    };
    /* Read `queue` only after idle, so every task queued on mount is included. */
    void Promise.race([
      landingIdle().then(() => wait(0)).then(() => queue),
      wait(SETTLE_FALLBACK_MS),
    ]).then(done);
    return () => {
      cancelled = true;
    };
  }, []);
  return settled;
}

/** Fetch an image into the HTTP cache; resolves once it has loaded (or failed). */
export function warmImage(attrs: {
  src: string;
  srcSet?: string;
  sizes?: string;
}): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    if (attrs.sizes) img.sizes = attrs.sizes;
    if (attrs.srcSet) img.srcset = attrs.srcSet;
    img.src = attrs.src;
  });
}

/**
 * Get a muted clip's first frames buffered without showing it: iOS ignores
 * preload and only fetches once playback starts, so start it and pause as
 * soon as a frame is ready.
 */
export function primeVideo(
  el: HTMLVideoElement,
  isShowing: () => boolean,
): Promise<void> {
  if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const finish = () => {
      el.removeEventListener("loadeddata", finish);
      el.removeEventListener("playing", finish);
      if (!isShowing()) el.pause();
      resolve();
    };
    el.addEventListener("loadeddata", finish);
    el.addEventListener("playing", finish);
    el.play().catch(() => {
      /* Autoplay refused (e.g. Low Power Mode): still ask for the data. */
      el.load();
    });
  });
}
