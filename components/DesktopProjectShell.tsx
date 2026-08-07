"use client";

import type { ReactNode } from "react";

import { NzeribeSignature } from "@/components/NzeribeSignature";
import { getDesktopProjectGridStyle } from "@/lib/desktop-canvas";

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

      {/* Reserves right column width; signature uses fixed viewport coords. */}
      <aside
        className="desktop-project-shell__signature"
        aria-hidden="true"
      />

      <NzeribeSignature />
    </div>
  );
}
