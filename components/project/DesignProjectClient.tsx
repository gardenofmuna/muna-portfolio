"use client";

import { useLayoutMode } from "@/hooks/useLayoutMode";

import { HomeDesktop } from "@/components/HomeDesktop";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectIndexNav } from "@/components/project/ProjectIndexNav";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
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
    return (
      <div className="project-narrow-fallback">
        <ProjectIndexNav
          activeNumber={project.number}
          total={project.indexTotal}
        />
        <ProjectHeader project={project} menuState="hidden" />
        <EgwuRecordsProject menuState="hidden" />
      </div>
    );
  }

  return <HomeDesktop initialProject={project} />;
}
