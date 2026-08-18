"use client";

import { HomeDesktop } from "@/components/HomeDesktop";
import type { ProjectDefinition } from "@/data/projects";

type Props = {
  project: ProjectDefinition;
};

/** Direct `/design/[slug]` visits use the same persistent desktop shell. */
export function EgwuDesktopPage({ project }: Props) {
  return <HomeDesktop initialProject={project} />;
}
