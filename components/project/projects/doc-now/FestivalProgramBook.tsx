"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import type { CoverFlowItem } from "@/components/project/CoverFlowCarousel";
import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";

/** Cover artboard. Interior halves share this ratio (800×1035 ≈ 1236×1600). */
const PAGE_W = 1236;
const PAGE_H = 1600;

type BookPage = {
  src: string;
  alt: string;
  side: "cover" | "left" | "right";
  density: "hard" | "soft";
};

function bookPagesFromSpreads(items: CoverFlowItem[]): BookPage[] {
  if (items.length < 2) return [];
  const front = items[0];
  const back = items[items.length - 1];
  const spreads = items.slice(1, -1);
  const pages: BookPage[] = [
    {
      src: front.src,
      alt: "DOC NOW 2025 festival program, front cover",
      side: "cover",
      density: "hard",
    },
  ];

  spreads.forEach((spread, index) => {
    const first = index === 0;
    const last = index === spreads.length - 1;
    pages.push({
      src: spread.src,
      alt: `${spread.alt}, left page`,
      side: "left",
      density: first ? "hard" : "soft",
    });
    pages.push({
      src: spread.src,
      alt: `${spread.alt}, right page`,
      side: "right",
      density: last ? "hard" : "soft",
    });
  });

  pages.push({
    src: back.src,
    alt: "DOC NOW 2025 festival program, back cover",
    side: "cover",
    density: "hard",
  });
  return pages;
}

function createPageElement(page: BookPage): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "festival-book__page";
  el.dataset.density = page.density;
  const img = document.createElement("img");
  img.src = page.src;
  img.alt = page.alt;
  img.className = `festival-book__img festival-book__img--${page.side}`;
  img.draggable = false;
  img.decoding = "async";
  el.appendChild(img);
  return el;
}

function patchMouseForStageScale(flip: {
  getUI: () => {
    getMousePos: (x: number, y: number) => { x: number; y: number };
    getDistElement: () => HTMLElement;
  };
}) {
  const ui = flip.getUI();
  const orig = ui.getMousePos.bind(ui);
  ui.getMousePos = (x, y) => {
    const pos = orig(x, y);
    const el = ui.getDistElement();
    const visual = el.getBoundingClientRect();
    const sx = visual.width / Math.max(1, el.offsetWidth);
    const sy = visual.height / Math.max(1, el.offsetHeight);
    return { x: pos.x / sx, y: pos.y / sy };
  };
}

/** StPageFlip draws a sharp gradient crease that hangs around as the leaf lands. */
function softenFlipLandingShadow(flip: {
  getRender: () => {
    setShadowData: (
      pos: { x: number; y: number },
      angle: number,
      progress: number,
      direction: number,
    ) => void;
    shadow?: { opacity: number; width: number };
  };
}) {
  const render = flip.getRender();
  const orig = render.setShadowData.bind(render);
  render.setShadowData = (pos, angle, progress, direction) => {
    orig(pos, angle, progress, direction);
    const shadow = render.shadow;
    if (!shadow) return;
    const t = Math.min(1, Math.max(0, progress / 100));
    const land = t < 0.55 ? 1 : Math.max(0, (1 - t) / 0.45);
    const eased = land * land;
    shadow.opacity *= eased;
    shadow.width *= 0.25 + 0.75 * eased;
  };
}

type BookShift = "front" | "open" | "back";

function shiftForPage(pageIndex: number, pageCount: number): BookShift {
  if (pageIndex <= 0) return "front";
  if (pageIndex >= pageCount - 1) return "back";
  return "open";
}

function destinationPage(
  current: number,
  pageCount: number,
  goingNext: boolean,
): number {
  if (goingNext) {
    if (current <= 0) return 1;
    if (current >= pageCount - 2) return pageCount - 1;
    return current + 2;
  }
  if (current <= 1) return 0;
  if (current >= pageCount - 1) return Math.max(0, pageCount - 2);
  return current - 2;
}

function trackBookShift(
  flip: {
    getCurrentPageIndex: () => number;
    getPageCount: () => number;
    getRender: () => { getDirection: () => number };
    on: (event: string, cb: (e: { data: unknown }) => void) => unknown;
  },
  host: HTMLElement,
) {
  const apply = (pageIndex: number) => {
    host.dataset.bookShift = shiftForPage(pageIndex, flip.getPageCount());
  };

  apply(flip.getCurrentPageIndex());

  flip.on("changeState", (event) => {
    if (event.data !== "flipping") return;
    const dest = destinationPage(
      flip.getCurrentPageIndex(),
      flip.getPageCount(),
      flip.getRender().getDirection() === 0,
    );
    apply(dest);
  });

  flip.on("flip", (event) => {
    apply(typeof event.data === "number" ? event.data : flip.getCurrentPageIndex());
  });
}

function FestivalProgramFlipbook({ items }: { items: CoverFlowItem[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<{
    destroy: () => void;
    flipNext: (corner?: "top" | "bottom") => void;
    flipPrev: (corner?: "top" | "bottom") => void;
  } | null>(null);
  const pages = useMemo(() => bookPagesFromSpreads(items), [items]);

  const measure = useCallback(() => {
    const host = hostRef.current;
    if (!host) return { pageW: 0, pageH: 0 };
    const bookW = host.clientWidth;
    const pageW = Math.max(1, Math.round(bookW / 2));
    const pageH = Math.round((pageW * PAGE_H) / PAGE_W);
    return { pageW, pageH };
  }, []);

  const [size, setSize] = useState(() => ({ pageW: 0, pageH: 0 }));

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const sync = () => {
      const next = measure();
      setSize((prev) =>
        prev.pageW === next.pageW && prev.pageH === next.pageH ? prev : next,
      );
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(host);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (!host || !stage || size.pageW < 8 || pages.length < 2) return;

    let cancelled = false;
    let root: HTMLDivElement | null = null;
    let instance: {
      destroy: () => void;
      flipNext: (corner?: "top" | "bottom") => void;
      flipPrev: (corner?: "top" | "bottom") => void;
    } | null = null;

    const start = async () => {
      const { PageFlip } = await import("page-flip/dist/js/page-flip.module.js");
      if (cancelled || !host.isConnected || !stage.isConnected) return;

      root = document.createElement("div");
      root.className = "festival-book__root";
      stage.appendChild(root);
      if (cancelled) {
        root.remove();
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const pageEls = pages.map(createPageElement);
      const flip = new PageFlip(root, {
        width: size.pageW,
        height: size.pageH,
        size: "stretch",
        minWidth: size.pageW,
        maxWidth: size.pageW,
        minHeight: size.pageH,
        maxHeight: size.pageH,
        showCover: true,
        usePortrait: false,
        autoSize: true,
        drawShadow: !reduceMotion,
        maxShadowOpacity: 0.14,
        flippingTime: reduceMotion ? 1 : 850,
        startZIndex: 1,
        startPage: 0,
        showPageCorners: !reduceMotion,
        disableFlipByClick: false,
        useMouseEvents: true,
        mobileScrollSupport: false,
        clickEventForward: true,
      });
      flip.loadFromHTML(pageEls);
      if (cancelled) {
        try {
          flip.destroy();
        } catch {
          /* already torn down */
        }
        if (root.parentNode) root.remove();
        return;
      }
      patchMouseForStageScale(flip);
      softenFlipLandingShadow(flip);
      trackBookShift(flip, host);
      instance = flip;
      flipRef.current = flip;
    };

    void start();

    return () => {
      cancelled = true;
      flipRef.current = null;
      try {
        instance?.destroy();
      } catch {
        /* already torn down */
      }
      if (root?.parentNode) root.remove();
      stage.replaceChildren();
      host.dataset.bookShift = "front";
    };
  }, [pages, size.pageH, size.pageW]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      flipRef.current?.flipNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      flipRef.current?.flipPrev();
    }
  };

  return (
    <div
      ref={hostRef}
      className="festival-book"
      data-book-shift="front"
      role="region"
      aria-label="DOC NOW 2025 festival program. Click or drag a page to turn. Arrow keys also turn pages."
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div ref={stageRef} className="festival-book__stage" />
    </div>
  );
}

export function FestivalProgramMedia({ items }: { items: CoverFlowItem[] }) {
  const probeRef = useRef<HTMLDivElement>(null);
  const [surface, setSurface] = useState<"pane" | "narrow" | null>(null);

  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    setSurface(probe.closest(".project-pane") ? "pane" : "narrow");
  }, []);

  return (
    <div ref={probeRef}>
      {surface === "pane" ? (
        <FestivalProgramFlipbook items={items} />
      ) : surface === "narrow" ? (
        <ProjectHorizontalStrip
          items={items}
          ariaLabel="DOC NOW 2025 festival program spreads"
          variant="poster"
        />
      ) : (
        <div style={{ minHeight: 280 }} aria-hidden />
      )}
    </div>
  );
}
