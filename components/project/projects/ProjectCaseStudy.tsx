"use client";

import { DocNowProject } from "@/components/project/projects/doc-now/DocNowProject";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { DOC_NOW_SLUG, type ProjectDefinition } from "@/data/projects";

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
    return <DocNowProject menuState={menuState} gallery={gallery} />;
  }

  return <EgwuRecordsProject menuState={menuState} gallery={gallery} />;
}
