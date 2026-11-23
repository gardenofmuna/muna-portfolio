import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import { SeoSummary } from "@/components/SeoSummary";
import { DesignProjectClient } from "@/components/project/DesignProjectClient";
import { PROJECTS, getProjectBySlug } from "@/data/projects";
import {
  SITE_NAME,
  clip,
  pageMetadata,
  projectJsonLd,
  projectName,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return pageMetadata({
    title: `${projectName(project)}, Design | ${SITE_NAME}`,
    description: clip(project.description),
    path: `/design/${project.slug}`,
    image: `/og/design-${project.slug}.jpg`,
    imageAlt: `${projectName(project)} by Muna Nzeribe`,
    type: "article",
  });
}

export async function generateStaticParams() {
  return Object.keys(PROJECTS).map((slug) => ({ slug }));
}

export default async function DesignProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <>
      <JsonLd data={projectJsonLd(project)} />
      <SeoSummary>
        <article>
          <h1>{projectName(project)}</h1>
          <p>{project.description}</p>
          <p>
            {project.sections.map((s) => s.title).join(", ")}. Design by Muna
            Nzeribe.
          </p>
        </article>
      </SeoSummary>
      <DesignProjectClient project={project} />
    </>
  );
}
