import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignProjectClient } from "@/components/project/DesignProjectClient";
import { getProjectBySlug } from "@/data/projects";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: `${project.title} | Muna | Portfolio`,
    description: project.description,
  };
}

export default async function DesignProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return <DesignProjectClient project={project} />;
}
