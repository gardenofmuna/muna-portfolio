"use client";

import dynamic from "next/dynamic";

import { useLayoutMode } from "@/hooks/useLayoutMode";

import type { ProjectDefinition } from "@/data/projects";

import "./project-pane.css";

const ProjectNarrowClient = dynamic(
  () =>
    import("@/components/project/ProjectNarrowClient").then(
      (mod) => mod.ProjectNarrowClient,
    ),
  { ssr: false },
);

const HomeDesktop = dynamic(
  () => import("@/components/HomeDesktop").then((mod) => mod.HomeDesktop),
  { ssr: false },
);

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
