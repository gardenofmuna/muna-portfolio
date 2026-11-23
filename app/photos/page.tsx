import type { Metadata } from "next";

import { PageEntryClient } from "@/components/PageEntryClient";
import { SeoSummary } from "@/components/SeoSummary";
import { SITE_IMAGE, SITE_NAME, pageMetadata } from "@/lib/seo";

const DESCRIPTION = "Photographs by Muna Nzeribe.";

export const metadata: Metadata = pageMetadata({
  title: `Photos | ${SITE_NAME}`,
  description: DESCRIPTION,
  path: "/photos",
  image: SITE_IMAGE.url,
  imageSize: SITE_IMAGE.size,
});

export default function PhotosPage() {
  return (
    <>
      <SeoSummary>
        <h1>Photos</h1>
        <p>{DESCRIPTION}</p>
      </SeoSummary>
      <PageEntryClient page="photos" />
    </>
  );
}
