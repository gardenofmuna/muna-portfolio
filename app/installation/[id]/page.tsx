import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InstallationEntryClient } from "@/components/InstallationEntryClient";
import { JsonLd } from "@/components/JsonLd";
import { SeoSummary } from "@/components/SeoSummary";
import {
  INSTALLATION_SHOWS,
  getInstallationShowById,
} from "@/data/installation";
import {
  SITE_NAME,
  installationDescription,
  installationJsonLd,
  installationTitle,
  installationVenue,
  pageMetadata,
  plain,
} from "@/lib/seo";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const show = getInstallationShowById(id);
  if (!show) return {};
  const title = installationTitle(show);
  return pageMetadata({
    title: `${title} (${show.year}) | ${SITE_NAME}`,
    description: installationDescription(show),
    path: `/installation/${show.id}`,
    image: `/og/installation-${show.id}.jpg`,
    imageAlt: show.alt,
    type: "article",
  });
}

export function generateStaticParams() {
  return INSTALLATION_SHOWS.map((show) => ({ id: show.id }));
}

export default async function InstallationShowRoute({ params }: PageProps) {
  const { id } = await params;
  const show = getInstallationShowById(id);
  if (!show) notFound();
  const title = installationTitle(show);
  const others = INSTALLATION_SHOWS.filter((s) => s.id !== show.id);
  return (
    <>
      <JsonLd data={installationJsonLd(show)} />
      <SeoSummary>
        <article>
          <h1>{title}</h1>
          <p>
            {show.year}, {show.kind}. {installationVenue(show)}.
          </p>
          {show.caseStudy.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>
              {plain(p)}
            </p>
          ))}
          {show.caseStudy.galleryCaption ? (
            <p>{show.caseStudy.galleryCaption}</p>
          ) : null}
          <p>By Muna Nzeribe.</p>
          <nav aria-label="Other installations">
            <ul>
              {others.map((s) => (
                <li key={s.id}>
                  <Link href={`/installation/${s.id}`}>
                    {installationTitle(s)} ({s.year})
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </SeoSummary>
      <InstallationEntryClient initialShowId={show.id} />
    </>
  );
}
