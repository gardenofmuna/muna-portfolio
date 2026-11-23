import Link from "next/link";

import { HomeEntryClient } from "@/components/HomeEntryClient";
import { SeoSummary } from "@/components/SeoSummary";
import { INSTALLATION_SHOWS } from "@/data/installation";
import { PROJECTS } from "@/data/projects";
import { SITE_DESCRIPTION, installationTitle, projectName } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <SeoSummary>
        <h1>Muna Nzeribe</h1>
        <p>{SITE_DESCRIPTION}</p>
        <nav aria-label="Site">
          <h2>Installations and exhibitions</h2>
          <ul>
            {INSTALLATION_SHOWS.map((s) => (
              <li key={s.id}>
                <Link href={`/installation/${s.id}`}>
                  {installationTitle(s)} ({s.year})
                </Link>
              </li>
            ))}
          </ul>
          <h2>Design</h2>
          <ul>
            {Object.values(PROJECTS).map((p) => (
              <li key={p.slug}>
                <Link href={`/design/${p.slug}`}>{projectName(p)}</Link>
              </li>
            ))}
          </ul>
          <ul>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/cv">CV and press</Link>
            </li>
            <li>
              <Link href="/photos">Photos</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </SeoSummary>
      <HomeEntryClient />
    </>
  );
}
