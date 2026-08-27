"use client";

import dynamic from "next/dynamic";

import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { DOC_NOW_SLUG, type ProjectDefinition } from "@/data/projects";

const DocNowProject = dynamic(
  () =>
    import("@/components/project/projects/doc-now/DocNowProject").then(
      (mod) => mod.DocNowProject,
    ),
);

const EgwuRecordsProject = dynamic(
  () =>
    import("@/components/project/projects/EgwuRecordsProject").then(
      (mod) => mod.EgwuRecordsProject,
    ),
);

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
