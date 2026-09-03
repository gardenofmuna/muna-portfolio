"use client";

import dynamic from "next/dynamic";

import { HomeNarrow } from "@/components/HomeNarrow";
import { useLayoutMode } from "@/hooks/useLayoutMode";

import type { ProjectDefinition } from "@/data/projects";

import "./project-pane.css";

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
    return <div className="absolute inset-0 bg-white" aria-hidden />;
  }

  if (mode === "narrow") {
    return <HomeNarrow initialProject={project} />;
  }

  return <HomeDesktop initialProject={project} />;
}
