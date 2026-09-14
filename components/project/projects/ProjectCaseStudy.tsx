"use client";

import { BounceRadioProject } from "@/components/project/projects/bounce/BounceRadioProject";
import { DevaultPresentsProject } from "@/components/project/projects/devault/DevaultPresentsProject";
import { DocNowProject } from "@/components/project/projects/doc-now/DocNowProject";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
import { MamaInYourAbsenceProject } from "@/components/project/projects/mama/MamaInYourAbsenceProject";
import { StudioOrryProject } from "@/components/project/projects/orry/StudioOrryProject";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import {
  BOUNCE_RADIO_SLUG,
  DEVAULT_PRESENTS_SLUG,
  DOC_NOW_SLUG,
  MAMA_IN_YOUR_ABSENCE_SLUG,
  STUDIO_ORRY_SLUG,
  type ProjectDefinition,
} from "@/data/projects";

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

  if (project.slug === BOUNCE_RADIO_SLUG) {
    return <BounceRadioProject menuState={menuState} />;
  }

  if (project.slug === STUDIO_ORRY_SLUG) {
    return <StudioOrryProject menuState={menuState} />;
  }

  if (project.slug === MAMA_IN_YOUR_ABSENCE_SLUG) {
    return <MamaInYourAbsenceProject menuState={menuState} />;
  }

  return <EgwuRecordsProject menuState={menuState} gallery={gallery} />;
}
