"use client";

import type { CSSProperties, ReactNode } from "react";

import {
  NARROW_CENTER_POPUP_MAX,
  NARROW_WHEEL_CENTER,
} from "@/lib/narrow-stage";

type Props = {
  visible: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Anchors narrow section previews to the wheel hub (Artboard_2 center).
 * Popups render behind nav labels (z-5 vs wheel z-10).
 */
export function NarrowCenterPopup({
  visible,
  children,
  className = "",
  style,
}: Props) {
  const { opacity, transition, transform, ...rest } = style ?? {};

  return (
    <div
      className={`pointer-events-none absolute z-[5] select-none ${className}`}
      aria-hidden={!visible}
      style={{
        left: NARROW_WHEEL_CENTER.x,
        top: NARROW_WHEEL_CENTER.y,
        width: NARROW_CENTER_POPUP_MAX,
        height: NARROW_CENTER_POPUP_MAX,
        transform: "translate(-50%, -50%)",
        ...rest,
      }}
    >
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ opacity, transition, transform }}
      >
        {children}
      </div>
    </div>
  );
}
