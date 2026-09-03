"use client";

import { DevaultPresentsProject } from "@/components/project/projects/devault/DevaultPresentsProject";
import { DocNowProject } from "@/components/project/projects/doc-now/DocNowProject";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { DEVAULT_PRESENTS_SLUG, DOC_NOW_SLUG, type ProjectDefinition } from "@/data/projects";

type Props = {
  project: ProjectDefinition;
  menuState: ProjectMenuState;
  gallery?: "coverflow" | "strip";
};

export function ProjectCaseStudy({
  project,
  menuState,
  gallery = "coverflow",
}: Props) {
  if (project.slug === DOC_NOW_SLUG) {
    return <DocNowProject menuState={menuState} />;
  }

  if (project.slug === DEVAULT_PRESENTS_SLUG) {
    return <DevaultPresentsProject menuState={menuState} />;
  }

  return <EgwuRecordsProject menuState={menuState} gallery={gallery} />;
}
