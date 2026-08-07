"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import {
  getDesktopCanvasMetrics,
  getDesktopProjectGridStyle,
  NZERIBE_IMG_H,
  NZERIBE_IMG_W,
} from "@/lib/desktop-canvas";

import type { ProjectMenuState } from "@/components/project/ProjectContentPane";

type Props = {
  children: ReactNode;
  menuState: ProjectMenuState;
  /** Navigation wheel layer — rendered in the nav zone stack. */
  nav: ReactNode;
};

/**
 * Explicit three-column desktop shell for project pages:
 * [ navigation zone ] [ project zone ] [ signature zone ]
 */
export function DesktopProjectShell({ children, menuState, nav }: Props) {
  const m = getDesktopCanvasMetrics();
  const gridStyle = getDesktopProjectGridStyle(menuState);

  return (
    <div
      className="desktop-project-shell"
      data-menu-state={menuState}
      style={gridStyle}
    >
      <div className="desktop-project-shell__nav" aria-hidden={false}>
        {nav}
      </div>

      <main className="desktop-project-shell__project">{children}</main>

      <aside
        className="desktop-project-shell__signature"
        aria-label="Site signature"
      >
        <div
          className="desktop-project-shell__signature-inner"
          style={{
            width: m.nzeribeW,
            height: m.nzeribeH,
          }}
        >
          <Image
            src="/nzeribe1.webp"
            alt="Nzeribe"
            width={NZERIBE_IMG_W}
            height={NZERIBE_IMG_H}
            className="block h-full w-full object-contain object-right object-bottom"
            sizes={`${NZERIBE_IMG_W}px`}
          />
        </div>
      </aside>
    </div>
  );
}
