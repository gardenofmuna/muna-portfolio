"use client";

import {
  createContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  DESKTOP_LAYOUT_H,
  DESKTOP_LAYOUT_SCALE,
  DESKTOP_LAYOUT_W,
  DESKTOP_STAGE_H,
  DESKTOP_STAGE_W,
  desktopStageFitMode,
  desktopStageLayoutSize,
  desktopWheelLayoutHeight,
  readWindowFrame,
  stageCoverOffset,
  stageCropAlignFromResize,
  type StageCropAlignX,
  type StageFitMode,
} from "@/lib/desktop-stage";

type Props = {
  children: ReactNode;
  className?: string;
};

export type DesktopStageViewValue = {
  mode: StageFitMode;
  scale: number;
  layoutW: number;
  layoutH: number;
  wheelLayoutH: number;
  viewportW: number;
  viewportH: number;
  offsetLeft: number;
  offsetTop: number;
  /** Screen px per layout-coordinate unit (view.scale × artboard scale). */
  layoutScreenUnit: number;
  /** Unscaled overlay root — width tweens must not run under transform:scale. */
  chromeEl: HTMLDivElement | null;
};

const defaultStageView: DesktopStageViewValue = {
  mode: "expand",
  scale: 1,
  layoutW: DESKTOP_LAYOUT_W,
  layoutH: DESKTOP_LAYOUT_H,
  wheelLayoutH: DESKTOP_LAYOUT_H,
  viewportW: DESKTOP_STAGE_W,
  viewportH: DESKTOP_STAGE_H,
  offsetLeft: 0,
  offsetTop: 0,
  layoutScreenUnit: DESKTOP_LAYOUT_SCALE,
  chromeEl: null,
};

export const DesktopStageViewContext =
  createContext<DesktopStageViewValue>(defaultStageView);

/**
 * Height-fill when wide enough; width-fit on 16:10 laptops so Q3 keeps
 * right padding; crop only when the window goes square / too narrow.
 * Nav wheel always fills the viewport height.
 */
export function DesktopStageCanvas({ children, className }: Props) {
  const [view, setView] = useState({
    mode: "expand" as StageFitMode,
    scale: 1,
    stageW: DESKTOP_STAGE_W,
    stageH: DESKTOP_STAGE_H,
    layoutW: DESKTOP_LAYOUT_W,
    layoutH: DESKTOP_LAYOUT_H,
    viewportW: DESKTOP_STAGE_W,
    viewportH: DESKTOP_STAGE_H,
    alignX: "left" as StageCropAlignX,
    wheelLayoutH: DESKTOP_LAYOUT_H,
  });
  const [chromeEl, setChromeEl] = useState<HTMLDivElement | null>(null);
  const frameRef = useRef<ReturnType<typeof readWindowFrame> | null>(null);
  const alignXRef = useRef<StageCropAlignX>("left");

  useLayoutEffect(() => {
    const update = () => {
      const next = readWindowFrame();
      const mode = desktopStageFitMode(next.width, next.height);
      const prev = frameRef.current;
      let alignX = alignXRef.current;
      if (mode === "crop" && prev) {
        const aligned = stageCropAlignFromResize(
          prev,
          next,
          alignX,
          "top",
        );
        alignX = aligned.alignX;
      }
      if (mode !== "crop") alignX = "left";
      frameRef.current = next;
      alignXRef.current = alignX;
      const size = desktopStageLayoutSize(next.width, next.height, mode);
      setView({
        mode,
        scale: size.scale,
        stageW: size.stageW,
        stageH: size.stageH,
        layoutW: size.layoutW,
        layoutH: size.layoutH,
        viewportW: next.width,
        viewportH: next.height,
        alignX,
        wheelLayoutH: desktopWheelLayoutHeight(next.height, size.scale),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const offset =
    view.mode === "crop"
      ? stageCoverOffset(
          view.viewportW,
          view.viewportH,
          view.scale,
          view.alignX,
          "top",
        )
      : { left: 0, top: 0 };

  const layoutScreenUnit = view.scale * DESKTOP_LAYOUT_SCALE;
  /* Nested scale() + 811.5 layout height rounds short in Safari — 1 CSS px
     extra so the last device pixel is covered (white seam at Q2 bottom). */
  const seamBleedLayout = layoutScreenUnit > 0 ? 1 / layoutScreenUnit : 0;
  const seamBleedStage = view.scale > 0 ? 1 / view.scale : 0;

  return (
    <DesktopStageViewContext.Provider
      value={{
        mode: view.mode,
        scale: view.scale,
        layoutW: view.layoutW,
        layoutH: view.layoutH,
        wheelLayoutH: view.wheelLayoutH,
        viewportW: view.viewportW,
        viewportH: view.viewportH,
        offsetLeft: offset.left,
        offsetTop: offset.top,
        layoutScreenUnit,
        chromeEl,
      }}
    >
      <div
        className={`fixed inset-0 z-0 bg-white ${className ?? ""}`}
        data-stage-mode={view.mode}
        style={{
          /* Crop mode must clip; fit/expand let rotated design hovers bleed */
          overflow: view.mode === "crop" ? "hidden" : "visible",
        }}
      >
        <div
          className="absolute"
          style={{
            width: view.stageW,
            height: view.stageH + seamBleedStage,
            left: offset.left,
            top: offset.top,
            transform: `scale(${view.scale})`,
            transformOrigin: "top left",
            overflow: view.mode === "fit" ? "visible" : "hidden",
          }}
          suppressHydrationWarning
        >
          <div
            className="absolute left-0 top-0"
            style={{
              width: view.layoutW,
              height: view.layoutH + seamBleedLayout,
              transform: `scale(${DESKTOP_LAYOUT_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
        {/*
          Unscaled chrome — signature width animation must not run under
          transform:scale or Safari relayouts every frame (glitchy expand).
        */}
        <div
          ref={(el) => {
            setChromeEl((prev) => (prev === el ? prev : el));
          }}
          className="pointer-events-none absolute inset-0 z-[35]"
          data-stage-chrome=""
        />
      </div>
    </DesktopStageViewContext.Provider>
  );
}
