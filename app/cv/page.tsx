import type { Metadata } from "next";

import { PageEntryClient } from "@/components/PageEntryClient";
import { SeoSummary } from "@/components/SeoSummary";
import { SITE_IMAGE, SITE_NAME, pageMetadata } from "@/lib/seo";

const DESCRIPTION =
  "CV, exhibitions, press and experience of Muna Nzeribe, designer, artist and curator based in Toronto.";

export const metadata: Metadata = pageMetadata({
  title: `CV and Press | ${SITE_NAME}`,
  description: DESCRIPTION,
  path: "/cv",
  image: SITE_IMAGE.url,
  imageSize: SITE_IMAGE.size,
});

export default function CvPage() {
  return (
    <>
      <SeoSummary>
        <h1>CV and Press</h1>
        <p>{DESCRIPTION}</p>
      </SeoSummary>
      <PageEntryClient page="cv + press" />
    </>
  );
}
