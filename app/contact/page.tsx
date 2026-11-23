import type { Metadata } from "next";

import { PageEntryClient } from "@/components/PageEntryClient";
import { SeoSummary } from "@/components/SeoSummary";
import { SITE_IMAGE, SITE_NAME, pageMetadata } from "@/lib/seo";

const DESCRIPTION =
  "Get in touch with Muna Nzeribe, designer, artist and curator based in Toronto.";

export const metadata: Metadata = pageMetadata({
  title: `Contact | ${SITE_NAME}`,
  description: DESCRIPTION,
  path: "/contact",
  image: SITE_IMAGE.url,
  imageSize: SITE_IMAGE.size,
});

export default function ContactPage() {
  return (
    <>
      <SeoSummary>
        <h1>Contact</h1>
        <p>{DESCRIPTION}</p>
      </SeoSummary>
      <PageEntryClient page="contact" />
    </>
  );
}
