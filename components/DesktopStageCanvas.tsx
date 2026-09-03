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

type StageView = {
  mode: StageFitMode;
  scale: number;
  stageW: number;
  layoutW: number;
  viewportW: number;
  viewportH: number;
  alignX: StageCropAlignX;
  wheelLayoutH: number;
};

export const DesktopStageViewContext = createContext({
  mode: "expand" as StageFitMode,
  scale: 1,
  layoutW: DESKTOP_LAYOUT_W,
  wheelLayoutH: DESKTOP_LAYOUT_H,
});

/**
 * Height-fill when wide enough; width-fit on 16:10 laptops so Q3 keeps
 * right padding; crop only when the window goes square / too narrow.
 * Nav wheel always fills the viewport height.
 */
export function DesktopStageCanvas({ children, className }: Props) {
  const [view, setView] = useState<StageView>({
    mode: "expand",
    scale: 1,
    stageW: DESKTOP_STAGE_W,
    layoutW: DESKTOP_LAYOUT_W,
    viewportW: DESKTOP_STAGE_W,
    viewportH: DESKTOP_STAGE_H,
    alignX: "left",
    wheelLayoutH: DESKTOP_LAYOUT_H,
  });
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
        layoutW: size.layoutW,
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
      : view.mode === "fit"
        ? {
            left: 0,
            top: (view.viewportH - DESKTOP_STAGE_H * view.scale) / 2,
          }
        : { left: 0, top: 0 };

  return (
      <DesktopStageViewContext.Provider
        value={{
          mode: view.mode,
          scale: view.scale,
          layoutW: view.layoutW,
          wheelLayoutH: view.wheelLayoutH,
        }}
      >
      <div
        className={`fixed inset-0 z-0 overflow-hidden bg-white ${className ?? ""}`}
        data-stage-mode={view.mode}
      >
        <div
          className="absolute"
          style={{
            width: view.stageW,
            height: DESKTOP_STAGE_H,
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
              height: DESKTOP_LAYOUT_H,
              transform: `scale(${DESKTOP_LAYOUT_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </DesktopStageViewContext.Provider>
  );
}
