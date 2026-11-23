import type { Metadata } from "next";

import type { InstallationShow } from "@/data/installation";
import type { ProjectDefinition } from "@/data/projects";

/**
 * Everything search engines and link previews read about the site, in one
 * place: page titles and descriptions, share images, and structured data
 * (schema.org JSON-LD) describing Muna and each exhibition.
 */

export const SITE_URL = "https://munanzeribe.xyz";
export const SITE_NAME = "Muna Nzeribe";
export const PERSON_ID = `${SITE_URL}/#muna`;

/** The site-wide share image (1024 × 576). */
export const SITE_IMAGE = {
  url: "/preview-image-2.jpg",
  size: [1024, 576] as [number, number],
};

export const SITE_DESCRIPTION =
  "Muna Nzeribe is a designer, artist and curator born in Lagos, Nigeria and based in Toronto. Exhibitions, installations, design and film, including Flora Nwapa: Efuru at the Threshold (2026).";

/** Turn [label](url) links into plain labels. */
export function plain(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/** Clip text for a meta description at a word boundary (about 160 characters). */
export function clip(text: string, max = 158): string {
  const clean = plain(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}

/** Shared metadata for one page: title, description, canonical URL, previews. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  imageSize = [1200, 630],
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  imageSize?: [number, number];
  type?: "website" | "article";
}): Metadata {
  const images = image
    ? [
        {
          url: image,
          width: imageSize[0],
          height: imageSize[1],
          alt: imageAlt ?? title,
        },
      ]
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Installations                                                       */
/* ------------------------------------------------------------------ */

export function installationTitle(show: InstallationShow): string {
  return show.titleLines.join(" ").replace(/\s+/g, " ").trim();
}

export function installationVenue(show: InstallationShow): string {
  return show.venueLines.join(" ").replace(/\s+/g, " ").trim();
}

export function installationDescription(show: InstallationShow): string {
  return clip(show.seoDescription ?? show.caseStudy.paragraphs[0] ?? "");
}

export function installationJsonLd(show: InstallationShow) {
  const title = installationTitle(show);
  const url = `${SITE_URL}/installation/${show.id}`;
  const ev = show.event;
  return {
    "@context": "https://schema.org",
    "@type": "ExhibitionEvent",
    "@id": `${url}#exhibition`,
    name: title,
    url,
    description: plain(show.caseStudy.paragraphs.join(" ")),
    image: [
      `${SITE_URL}/og/installation-${show.id}.jpg`,
      `${SITE_URL}${show.src}`,
    ],
    startDate: ev?.startDate ?? show.year,
    ...(ev?.endDate ? { endDate: ev.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: ev?.venue ?? installationVenue(show),
      ...(ev?.address
        ? {
            address: {
              "@type": "PostalAddress",
              addressLocality: ev.address.locality,
              addressCountry: ev.address.country,
            },
          }
        : {}),
    },
    ...(ev?.organizer
      ? { organizer: { "@type": "Organization", name: ev.organizer } }
      : {}),
    contributor: { "@id": PERSON_ID },
    ...(ev?.about ? { about: ev.about } : {}),
    isAccessibleForFree: true,
  };
}

/* ------------------------------------------------------------------ */
/* Design projects                                                     */
/* ------------------------------------------------------------------ */

/** Project titles are set in capitals on the page; search results get the proper name. */
const PROJECT_NAMES: Record<string, string> = {
  "egwu-records": "EGWÚ Records",
  "doc-now-2025": "DOC NOW 2025",
  "devault-presents": "Devault Presents",
  "studio-orry": "Studio Orry",
  "mama-in-your-absence": "Mama, in Your Absence",
  "bounce-radio": "Bounce Radio",
};

export function projectName(project: ProjectDefinition): string {
  return PROJECT_NAMES[project.slug] ?? project.title;
}

export function projectJsonLd(project: ProjectDefinition) {
  const url = `${SITE_URL}/design/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: projectName(project),
    url,
    description: project.description,
    image: `${SITE_URL}/og/design-${project.slug}.jpg`,
    genre: "Graphic design",
    creator: { "@id": PERSON_ID },
  };
}

/* ------------------------------------------------------------------ */
/* Site-wide: who Muna is                                              */
/* ------------------------------------------------------------------ */

export const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": PERSON_ID },
      inLanguage: "en",
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Muna Nzeribe",
      alternateName: "Munachiso Nzeribe",
      url: SITE_URL,
      image: `${SITE_URL}/preview-image-2.jpg`,
      jobTitle: "Designer, artist and curator",
      description:
        "Designer and artist born in Lagos, Nigeria and living and working in Toronto, Canada, with a BSc in Mass Communication (2022) and an MFA in Documentary Media (2025).",
      birthPlace: { "@type": "Place", name: "Lagos, Nigeria" },
      homeLocation: { "@type": "Place", name: "Toronto, Canada" },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Toronto Metropolitan University",
      },
      knowsAbout: [
        "Graphic design",
        "Installation art",
        "Documentary media",
        "Curating",
        "Flora Nwapa",
      ],
      sameAs: ["https://www.instagram.com/gardenofmuna/"],
    },
  ],
};
