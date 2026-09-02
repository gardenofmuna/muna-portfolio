declare module "page-flip" {
  export type FlipCorner = "top" | "bottom";

  export type PageFlipSettings = {
    startPage?: number;
    size?: "fixed" | "stretch";
    width: number;
    height: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  };

  export class PageFlip {
    constructor(element: HTMLElement, settings: PageFlipSettings);
    destroy(): void;
    update(): void;
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void;
    flipNext(corner?: FlipCorner): void;
    flipPrev(corner?: FlipCorner): void;
    getUI(): {
      getMousePos: (x: number, y: number) => { x: number; y: number };
      getDistElement: () => HTMLElement;
    };
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getRender(): {
      setShadowData: (
        pos: { x: number; y: number },
        angle: number,
        progress: number,
        direction: number,
      ) => void;
      getDirection: () => number;
      shadow?: { opacity: number; width: number };
    };
    on(event: string, cb: (e: { data: unknown }) => void): this;
  }
}

declare module "page-flip/dist/js/page-flip.module.js" {
  export { PageFlip } from "page-flip";
}
