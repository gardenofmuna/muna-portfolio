import type { Metadata } from "next";

import { PageEntryClient } from "@/components/PageEntryClient";
import { SeoSummary } from "@/components/SeoSummary";
import { SITE_IMAGE, SITE_NAME, pageMetadata } from "@/lib/seo";

const DESCRIPTION =
  "Muna Nzeribe (b. 2001) is a designer and artist born in Lagos, Nigeria and living and working in Toronto, Canada, with a BSc in Mass Communication and an MFA in Documentary Media.";

export const metadata: Metadata = pageMetadata({
  title: `About | ${SITE_NAME}`,
  description: DESCRIPTION,
  path: "/about",
  image: SITE_IMAGE.url,
  imageSize: SITE_IMAGE.size,
});

export default function AboutPage() {
  return (
    <>
      <SeoSummary>
        <h1>About</h1>
        <p>{DESCRIPTION}</p>
      </SeoSummary>
      <PageEntryClient page="about" />
    </>
  );
}
