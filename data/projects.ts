export type ProjectSectionLink = {
  id: string;
  label: string;
  color: string;
};

export type ProjectSection = {
  id: string;
  title: string;
};

export type ProjectDefinition = {
  slug: string;
  number: string;
  indexTotal: number;
  title: string;
  description: string;
  sidebarActiveLabel: string;
  sectionLinks: ProjectSectionLink[];
  sections: ProjectSection[];
};

export const EGWU_RECORDS_SLUG = "egwu-records";

const EGWU_RECORDS: ProjectDefinition = {
  slug: EGWU_RECORDS_SLUG,
  number: "I",
  indexTotal: 10,
  title: "EGWÚ RECORDS",
  description:
    "Brand identity and visual system for EGWÚ Records, a Lagos-based record store and cultural platform celebrating music across generations. Inspired by vintage record labels and Nigerian print culture, the identity extends across logos, merchandise, event posters, and a comprehensive brand guidelines system.",
  sidebarActiveLabel: "design",
  sectionLinks: [
    { id: "logo", label: "Logo,", color: "#85cdf2" },
    { id: "colors", label: "Branding,", color: "#92cba2" },
    { id: "merchandise", label: "Merchandise", color: "#edd039" },
    { id: "posters", label: "Event Posters,", color: "#df7035" },
    { id: "playlist-cover", label: "Playlist Covers,", color: "#999ed3" },
  ],
  sections: [
    { id: "logo", title: "Logo" },
    { id: "colors", title: "Colors" },
    { id: "posters", title: "Posters" },
    { id: "merchandise", title: "Merchandise" },
    { id: "playlist-cover", title: "Playlist Cover" },
  ],
};

export const PROJECTS: Record<string, ProjectDefinition> = {
  [EGWU_RECORDS_SLUG]: EGWU_RECORDS,
};

export function getProjectBySlug(slug: string): ProjectDefinition | undefined {
  return PROJECTS[slug];
}

export const PROJECT_NAV_LABELS = [
  "design",
  "installation",
  "photos",
  "film",
  "selected works",
  "cv + press",
  "contact",
  "about",
] as const;

export type EgwuLogoAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export const EGWU_LOGOS: EgwuLogoAsset[] = [
  {
    src: "/projects/egwu/logos/logo-vertical.webp",
    alt: "EGWÚ Records vertical logo with illustrated figure on a black square",
    width: 420,
    height: 420,
    className: "project-egwu-logo-vertical",
  },
  {
    src: "/projects/egwu/logos/logo-wordmark.webp",
    alt: "EGWÚ Records lowercase wordmark",
    width: 620,
    height: 120,
    className: "project-egwu-logo-wordmark",
  },
  {
    src: "/projects/egwu/logos/logo-badge.webp",
    alt: "EGWÚ Records badge logo with stylized e mark and records EGWÚ lettering",
    width: 520,
    height: 160,
    className: "project-egwu-logo-badge",
  },
];

import type { CoverFlowItem } from "@/components/project/CoverFlowCarousel";

export type EgwuImageAsset = CoverFlowItem;

/** Default resting poster in reference: green postage-stamp (poster-06). */
export const EGWU_POSTERS_INITIAL_INDEX = 5;

export const EGWU_POSTERS: CoverFlowItem[] = [
  {
    src: "/projects/egwu/posters/poster-01.webp",
    alt: "EGWÚ Records event poster with green postage-stamp frame and EGWÚ and Friends lineup",
    width: 1080,
    height: 1350,
    label: "EGWÚ and Friends lineup",
  },
  {
    src: "/projects/egwu/posters/poster-02.webp",
    alt: "EGWÚ Records event poster with yellow and black graphic layout",
    width: 1080,
    height: 1350,
    label: "Yellow and black layout",
  },
  {
    src: "/projects/egwu/posters/poster-03.webp",
    alt: "EGWÚ Records event poster with pink and black typographic composition",
    width: 1080,
    height: 1080,
    label: "Pink typographic composition",
  },
  {
    src: "/projects/egwu/posters/poster-04.webp",
    alt: "EGWÚ Records event poster with red geometric poster design",
    width: 1080,
    height: 1350,
    label: "Red geometric design",
  },
  {
    src: "/projects/egwu/posters/poster-05.webp",
    alt: "EGWÚ Records event poster with warm-toned collage layout",
    width: 1080,
    height: 1351,
    label: "Warm-toned collage",
  },
  {
    src: "/projects/egwu/posters/poster-06.webp",
    alt: "EGWÚ Records event poster with green postage-stamp frame and EGWÚ and Friends February event",
    width: 1080,
    height: 1350,
    label: "Green postage-stamp poster",
  },
];

/** Default resting item in reference: black tee with green stamp graphic. */
export const EGWU_MERCHANDISE_INITIAL_INDEX = 1;

export const EGWU_MERCHANDISE: CoverFlowItem[] = [
  {
    src: "/projects/egwu/merchandise/tshirt-white.webp",
    alt: "White EGWÚ Records t-shirt with blue chest graphic",
    width: 2000,
    height: 2000,
    label: "White t-shirt",
  },
  {
    src: "/projects/egwu/merchandise/tshirt-black-front.webp",
    alt: "Black EGWÚ Records t-shirt with postage-stamp graphic on the front",
    width: 2000,
    height: 2000,
    label: "Black t-shirt with green stamp",
  },
  {
    src: "/projects/egwu/merchandise/tshirt-black-front-1.webp",
    alt: "Black EGWÚ Records t-shirt front view with centered event artwork",
    width: 2000,
    height: 2000,
    label: "Black t-shirt with centered artwork",
  },
  {
    src: "/projects/egwu/merchandise/tshirt-black-front-2.webp",
    alt: "Black EGWÚ Records t-shirt front view with alternate graphic placement",
    width: 2000,
    height: 2000,
    label: "Black t-shirt alternate front",
  },
  {
    src: "/projects/egwu/merchandise/tshirt-black-back.webp",
    alt: "Black EGWÚ Records t-shirt back view",
    width: 2000,
    height: 2000,
    label: "Black t-shirt back",
  },
  {
    src: "/projects/egwu/merchandise/bandana-red.webp",
    alt: "Red EGWÚ Records bandana with all-over print",
    width: 2000,
    height: 2000,
    scale: 1.08,
    label: "Red bandana",
  },
  {
    src: "/projects/egwu/merchandise/bandana-black.webp",
    alt: "Black EGWÚ Records bandana with all-over print",
    width: 2000,
    height: 2000,
    scale: 1.08,
    label: "Black bandana",
  },
];

export const EGWU_COLORS = {
  src: "/projects/egwu/colors.webp",
  alt: "EGWÚ Records primary and secondary color palettes with labeled swatches",
  width: 1600,
  height: 760,
} as const;

export const EGWU_PLAYLIST_COVER = {
  src: "/projects/egwu/playlist-cover.webp",
  alt: "EGWÚ Records high energy cassette playlist cover artwork",
  width: 1200,
  height: 760,
} as const;
