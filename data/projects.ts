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
export const DOC_NOW_SLUG = "doc-now-2025";

const EGWU_RECORDS: ProjectDefinition = {
  slug: EGWU_RECORDS_SLUG,
  number: "I",
  indexTotal: 10,
  title: "EGWÚ RECORDS",
  description:
    "Brand identity and visual system for EGWÚ Records, a Lagos-based record store and cultural platform celebrating music across generations. Inspired by vintage record labels and Nigerian print culture, the identity extends across logos, merchandise, event posters, and a comprehensive brand guidelines system.",
  sidebarActiveLabel: "design",
  sectionLinks: [
    /* Same accent palette as landing AboutBio */
    { id: "logo", label: "Logo,", color: "#488bdc" },
    { id: "colors", label: "Branding,", color: "#019f4b" },
    { id: "merchandise", label: "Merchandise,", color: "#f9b109" },
    { id: "posters", label: "Event Posters,", color: "#fe5418" },
    { id: "playlist-cover", label: "Playlist Covers,", color: "#5d639f" },
  ],
  sections: [
    { id: "logo", title: "Logo" },
    { id: "colors", title: "Colors" },
    { id: "posters", title: "Posters" },
    { id: "merchandise", title: "Merchandise" },
    { id: "playlist-cover", title: "Playlist Cover" },
  ],
};

const DOC_NOW_2025: ProjectDefinition = {
  slug: DOC_NOW_SLUG,
  number: "II",
  indexTotal: 10,
  title: "DOC NOW 2025",
  description:
    "Visual identity for Toronto Metropolitan University’s 17th annual Documentary Media festival. Inspired by analog film hardware and contact-sheet grids, the system extends across a logo refresh, posters, festival program, social assets, and the festival website.",
  sidebarActiveLabel: "design",
  sectionLinks: [
    { id: "posters", label: "Posters,", color: "#488bdc" },
    { id: "logo-refresh", label: "Logo Refresh,", color: "#019f4b" },
    { id: "website-design", label: "Website Design,", color: "#f9b109" },
    { id: "festival-program", label: "Festival Program,", color: "#fe5418" },
    { id: "social", label: "Social Media Assets,", color: "#5d639f" },
  ],
  sections: [
    { id: "logo-refresh", title: "Logo Refresh" },
    { id: "colors", title: "Colors" },
    { id: "posters", title: "Posters" },
    { id: "festival-program", title: "Festival Program" },
    { id: "social", title: "Social Media Assets" },
    { id: "website-design", title: "Website Design" },
  ],
};

export const PROJECTS: Record<string, ProjectDefinition> = {
  [EGWU_RECORDS_SLUG]: EGWU_RECORDS,
  [DOC_NOW_SLUG]: DOC_NOW_2025,
};

export const PROJECTS_BY_NUMBER: Partial<Record<string, string>> = {
  I: EGWU_RECORDS_SLUG,
  II: DOC_NOW_SLUG,
};

export function getProjectBySlug(slug: string): ProjectDefinition | undefined {
  return PROJECTS[slug];
}

export function getProjectSlugByNumber(number: string): string | undefined {
  return PROJECTS_BY_NUMBER[number];
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
  width: 1575,
  height: 800,
} as const;

export const EGWU_PLAYLIST_COVER = {
  src: "/projects/egwu/playlist-cover.webp",
  alt: "EGWÚ Records high energy cassette playlist cover artwork",
  width: 1700,
  height: 1700,
} as const;

const DOC_NOW_DIR = "/projects/DOC NOW 2025";

function docNowSrc(relativePath: string) {
  return `${DOC_NOW_DIR}/${relativePath}`;
}

export const DOC_NOW_LOGO = {
  src: docNowSrc("logo refresh/DOC NOW 2025 LOGO.svg"),
  alt: "DOC NOW 2025 logo on charcoal square",
  width: 1080,
  height: 1080,
} as const;

export const DOC_NOW_COLORS = {
  src: docNowSrc("Color Palette Doc Now 2025.webp"),
  alt: "DOC NOW 2025 color palette with labeled swatches",
  width: 1575,
  height: 800,
} as const;

export const DOC_NOW_POSTERS: CoverFlowItem[] = [
  {
    src: docNowSrc("Posters/DOC NOW POSTER 1.webp"),
    alt: "DOC NOW 2025 festival poster with film-strip grid of portraits and program details",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Posters/DOC NOW POSTER 2.webp"),
    alt: "DOC NOW 2025 Bake Sale and second-hand sale poster",
    width: 1236,
    height: 1600,
  },
  {
    src: docNowSrc("Posters/DOC NOW POSTER 3.webp"),
    alt: "DOC NOW 2025 donor package poster with camera and hand grid",
    width: 1132,
    height: 1600,
  },
];

export const DOC_NOW_PROGRAM: CoverFlowItem[] = [
  {
    src: docNowSrc("Festival program/DOCNOW2025PROGRAM-Spread_page-0001.webp"),
    alt: "DOC NOW 2025 festival program spread 1",
    width: 1236,
    height: 1600,
  },
  {
    src: docNowSrc("Festival program/DOCNOW2025PROGRAM-Spread_page-0002.webp"),
    alt: "DOC NOW 2025 festival program spread 2",
    width: 1600,
    height: 1035,
  },
  {
    src: docNowSrc("Festival program/DOCNOW2025PROGRAM-Spread_page-0003.webp"),
    alt: "DOC NOW 2025 festival program spread 3",
    width: 1600,
    height: 1035,
  },
  {
    src: docNowSrc("Festival program/DOCNOW2025PROGRAM-Spread_page-0004.webp"),
    alt: "DOC NOW 2025 festival program spread 4",
    width: 1600,
    height: 1035,
  },
  {
    src: docNowSrc("Festival program/DOCNOW2025PROGRAM-Spread_page-0005.webp"),
    alt: "DOC NOW 2025 festival program spread 5",
    width: 1600,
    height: 1035,
  },
  {
    src: docNowSrc("Festival program/DOCNOW2025PROGRAM-Spread_page-0006.webp"),
    alt: "DOC NOW 2025 festival program spread 6",
    width: 1600,
    height: 1035,
  },
  {
    src: docNowSrc("Festival program/DOCNOW2025PROGRAM-Spread_page-0007.webp"),
    alt: "DOC NOW 2025 festival program spread 7",
    width: 1236,
    height: 1600,
  },
];

export const DOC_NOW_SOCIAL: CoverFlowItem[] = [
  {
    src: docNowSrc("Social Media Assets/1.webp"),
    alt: "DOC NOW 2025 social post showcasing artists",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Social Media Assets/2.webp"),
    alt: "DOC NOW 2025 social post 2",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Social Media Assets/3.webp"),
    alt: "DOC NOW 2025 social post 3",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Social Media Assets/4.webp"),
    alt: "DOC NOW 2025 social post 4",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Social Media Assets/5.webp"),
    alt: "DOC NOW 2025 social post 5",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Social Media Assets/6.webp"),
    alt: "DOC NOW 2025 social post 6",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Social Media Assets/7.webp"),
    alt: "DOC NOW 2025 social post 7",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Social Media Assets/8.webp"),
    alt: "DOC NOW 2025 social post 8",
    width: 1080,
    height: 1350,
  },
  {
    src: docNowSrc("Social Media Assets/DOC NOW ANIMATION.gif"),
    alt: "DOC NOW 2025 social animation",
    width: 400,
    height: 500,
  },
];

export const DOC_NOW_WEBSITE: CoverFlowItem[] = [
  {
    src: docNowSrc("Website design/1.webp"),
    alt: "DOC NOW 2025 website screenshot 1",
    width: 1600,
    height: 903,
  },
  {
    src: docNowSrc("Website design/2.webp"),
    alt: "DOC NOW 2025 website screenshot 2",
    width: 1600,
    height: 903,
  },
  {
    src: docNowSrc("Website design/3.webp"),
    alt: "DOC NOW 2025 website screenshot 3",
    width: 1600,
    height: 903,
  },
  {
    src: docNowSrc("Website design/4.webp"),
    alt: "DOC NOW 2025 website screenshot 4",
    width: 1600,
    height: 903,
  },
  {
    src: docNowSrc("Website design/5.webp"),
    alt: "DOC NOW 2025 website screenshot 5",
    width: 1600,
    height: 903,
  },
  {
    src: docNowSrc("Website design/WEBSITE-RECORDING-DESKTOP.mp4"),
    alt: "DOC NOW 2025 website desktop recording",
    width: 1600,
    height: 903,
    kind: "video",
    poster: docNowSrc("Website design/1.webp"),
  },
  {
    src: docNowSrc("Website design/WEBSITE-RECORDING-MOBILE.mp4"),
    alt: "DOC NOW 2025 website mobile recording",
    width: 590,
    height: 1190,
    kind: "video",
    poster: docNowSrc("Website design/5.webp"),
  },
];

