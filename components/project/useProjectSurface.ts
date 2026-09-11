"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type ProjectSurface = "pane" | "narrow";

/** Detect whether project content is in the desktop pane or narrow shell. */
export function useProjectSurface() {
  const probeRef = useRef<HTMLDivElement>(null);
  const [surface, setSurface] = useState<ProjectSurface | null>(null);

  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    setSurface(probe.closest(".project-pane") ? "pane" : "narrow");
  }, []);

  return { probeRef, surface };
}
