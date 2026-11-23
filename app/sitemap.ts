import type { MetadataRoute } from "next";

import { INSTALLATION_SHOWS } from "@/data/installation";
import { PROJECTS } from "@/data/projects";
import { SITE_URL } from "@/lib/seo";

/** Every public page, so search engines can find them all. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
  ) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "weekly"),
    page("/installation", 0.9, "weekly"),
    ...INSTALLATION_SHOWS.map((s, i) =>
      page(`/installation/${s.id}`, i === 0 ? 0.9 : 0.8),
    ),
    ...Object.values(PROJECTS).map((p) => page(`/design/${p.slug}`, 0.7)),
    page("/about", 0.7),
    page("/cv", 0.6),
    page("/photos", 0.5),
    page("/contact", 0.5),
  ];
}
