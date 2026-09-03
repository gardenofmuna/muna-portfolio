/**
 * Chrome iOS opened from Messages lays out `position:fixed; inset:0` against
 * the layout viewport. That origin can sit ~230px above the visible webview
 * (`visualViewport.offsetTop`). Logo, wheel, and footer all live in #__next,
 * so the whole landing shifts up until refresh.
 *
 * Pin #__next to visualViewport when that offset is Messages-scale.
 * Do not use 100svh / innerHeight. URL-bar offsets (~50–80px) are ignored.
 */
export const VISUAL_VIEWPORT_EVENT = "muna-visual-viewport";

const MESSAGES_OFFSET_PX = 100;

export function pinToVisualViewport() {
  if (typeof window === "undefined") return;
  const el = document.getElementById("__next");
  const vv = window.visualViewport;
  if (!el || !vv || vv.height <= 0) return;

  const alreadyPinned = el.dataset.vvPin === "1";
  const shouldPin =
    vv.offsetTop > MESSAGES_OFFSET_PX ||
    (!alreadyPinned && el.getBoundingClientRect().top < -1);

  if (!shouldPin) {
    if (!alreadyPinned) return;
    delete el.dataset.vvPin;
    el.style.top = "";
    el.style.left = "";
    el.style.width = "";
    el.style.height = "";
    el.style.right = "";
    el.style.bottom = "";
    window.dispatchEvent(new Event(VISUAL_VIEWPORT_EVENT));
    return;
  }

  const top = `${Math.round(vv.offsetTop)}px`;
  const left = `${Math.round(vv.offsetLeft)}px`;
  const width = `${Math.round(vv.width)}px`;
  const height = `${Math.round(vv.height)}px`;
  if (
    alreadyPinned &&
    el.style.top === top &&
    el.style.height === height &&
    el.style.width === width &&
    el.style.left === left
  ) {
    return;
  }

  el.dataset.vvPin = "1";
  el.style.top = top;
  el.style.left = left;
  el.style.width = width;
  el.style.height = height;
  el.style.right = "auto";
  el.style.bottom = "auto";
  window.dispatchEvent(new Event(VISUAL_VIEWPORT_EVENT));
}
