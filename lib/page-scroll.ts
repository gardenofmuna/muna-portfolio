"use client";

import { useLayoutEffect, type RefObject } from "react";

import { holdStableLayout } from "@/lib/stable-viewport";

/**
 * iOS Safari only lets a page run under its floating toolbar when the
 * document itself scrolls; an inner overflow box never does. While a long
 * mobile page is open, its scroll box hands scrolling to the document:
 * the box and its ancestors drop their fixed / clipped layout (see the
 * matching rules in globals.css), and the box's scrollTop, scrollTo and
 * scroll events are forwarded to the window so code that drives the box
 * keeps working as is.
 */
const ROOT_ATTR = "data-page-scroll";
const PATH_ATTR = "data-page-scroll-path";

let holders = 0;
const pathCounts = new WeakMap<Element, number>();

function retain(node: Element) {
  pathCounts.set(node, (pathCounts.get(node) ?? 0) + 1);
  node.setAttribute(PATH_ATTR, "");
}

function release(node: Element) {
  const left = (pathCounts.get(node) ?? 1) - 1;
  pathCounts.set(node, left);
  if (left <= 0) node.removeAttribute(PATH_ATTR);
}

function scrollWindow(...args: unknown[]) {
  (window.scrollTo as (...a: unknown[]) => void)(...args);
}

export function usePageScroll(
  active: boolean,
  scrollerRef: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!active || !el) return;

    const root = document.documentElement;
    const path: Element[] = [el];
    for (
      let node = el.parentElement;
      node && node !== document.body;
      node = node.parentElement
    ) {
      path.push(node);
    }

    const unhold = holdStableLayout();
    holders += 1;
    root.setAttribute(ROOT_ATTR, "");
    path.forEach(retain);

    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      get: () => window.scrollY,
      set: (top: number) => window.scrollTo(window.scrollX, top),
    });
    Object.defineProperty(el, "scrollTo", {
      configurable: true,
      value: scrollWindow,
    });
    const forward = () => el.dispatchEvent(new Event("scroll"));
    window.addEventListener("scroll", forward, { passive: true });
    window.scrollTo(0, 0);

    return () => {
      window.removeEventListener("scroll", forward);
      window.scrollTo(0, 0);
      Reflect.deleteProperty(el, "scrollTop");
      Reflect.deleteProperty(el, "scrollTo");
      path.forEach(release);
      holders -= 1;
      if (holders <= 0) {
        holders = 0;
        root.removeAttribute(ROOT_ATTR);
      }
      unhold();
    };
  }, [active, scrollerRef]);
}
