"use client";

import { useEffect } from "react";

const FLAG = "debugtop";

function box(css: string) {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = `pointer-events:none;${css}`;
  document.body.appendChild(el);
  return el;
}

/**
 * Temporary on-device probe for the band some iPad browsers show above the
 * fixed header. Enabled with ?debugtop (kept for the tab via sessionStorage).
 * Red = fixed above the viewport, lime = sticky cover, blue = plain document
 * box moved by script.
 */
export function TopGapDebug() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has(FLAG)) sessionStorage.setItem(FLAG, "1");
    if (sessionStorage.getItem(FLAG) !== "1") return;
    document.documentElement.setAttribute("data-debug-top", "");

    const red = box("position:fixed;left:0;right:0;top:-60px;height:60px;background:#f00;z-index:9998");
    const blue = box("position:absolute;left:0;width:100%;height:60px;background:#0050ff;z-index:9997");
    const safe = box("position:fixed;visibility:hidden;top:0;left:0;padding-top:env(safe-area-inset-top)");
    const panel = box(
      "position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;padding:8px;background:rgba(0,0,0,.8);color:#fff;font:11px/1.4 ui-monospace,monospace;white-space:pre-wrap",
    );

    const r = (n: number | undefined) => (n === undefined ? "-" : n.toFixed(1));
    const read = () => {
      const vv = window.visualViewport;
      blue.style.top = `${window.scrollY - 60}px`;
      const header = [...document.querySelectorAll<HTMLElement>("header")].find(
        (el) => getComputedStyle(el).position === "fixed",
      );
      const cover = document.querySelector(".page-scroll-cover");
      panel.textContent = [
        `inner ${window.innerWidth}x${window.innerHeight} client ${document.documentElement.clientHeight}`,
        `vv h ${r(vv?.height)} offTop ${r(vv?.offsetTop)} pageTop ${r(vv?.pageTop)} scale ${r(vv?.scale)}`,
        `scrollY ${r(window.scrollY)} screen ${screen.width}x${screen.height}`,
        `safeTop ${getComputedStyle(safe).paddingTop} pageScroll ${document.documentElement.hasAttribute("data-page-scroll")}`,
        `header top ${r(header?.getBoundingClientRect().top)} cover top ${r(cover?.getBoundingClientRect().top)}`,
        navigator.userAgent.slice(0, 140),
      ].join("\n");
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    const timer = window.setInterval(read, 250);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
      window.clearInterval(timer);
      [red, blue, safe, panel].forEach((el) => el.remove());
    };
  }, []);

  return null;
}
