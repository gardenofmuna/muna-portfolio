"use client";

import { useLayoutMode } from "@/hooks/useLayoutMode";

import { HomeDesktop } from "@/components/HomeDesktop";
import { ProjectNarrowClient } from "@/components/project/ProjectNarrowClient";
import type { ProjectDefinition } from "@/data/projects";

import "./project-pane.css";

type Props = {
  project: ProjectDefinition;
};

export function DesignProjectClient({ project }: Props) {
  const { mode, ready } = useLayoutMode();

  if (!ready) {
    return <div className="fixed inset-0 bg-white" aria-hidden />;
  }

  if (mode === "narrow") {
    return <ProjectNarrowClient project={project} />;
  }

  return <HomeDesktop initialProject={project} />;
}
