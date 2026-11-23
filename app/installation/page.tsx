import type { Metadata } from "next";
import Link from "next/link";

import { PageEntryClient } from "@/components/PageEntryClient";
import { SeoSummary } from "@/components/SeoSummary";
import { INSTALLATION_SHOWS } from "@/data/installation";
import {
  SITE_IMAGE,
  SITE_NAME,
  installationTitle,
  pageMetadata,
} from "@/lib/seo";

const DESCRIPTION =
  "Installations and exhibitions by Muna Nzeribe, including Flora Nwapa: Efuru at the Threshold (2026), Mama, in Your Absence (2025), Oguta-Lagos-Toronto (2025) and Akuabata. Nkiruka. (2024).";

export const metadata: Metadata = pageMetadata({
  title: `Installations and Exhibitions | ${SITE_NAME}`,
  description: DESCRIPTION,
  path: "/installation",
  image: SITE_IMAGE.url,
  imageSize: SITE_IMAGE.size,
});

export default function InstallationPage() {
  return (
    <>
      <SeoSummary>
        <h1>Installations and Exhibitions</h1>
        <p>{DESCRIPTION}</p>
        <ul>
          {INSTALLATION_SHOWS.map((s) => (
            <li key={s.id}>
              <Link href={`/installation/${s.id}`}>
                {installationTitle(s)} ({s.year}), {s.kind}
              </Link>
            </li>
          ))}
        </ul>
      </SeoSummary>
      <PageEntryClient page="installation" />
    </>
  );
}
