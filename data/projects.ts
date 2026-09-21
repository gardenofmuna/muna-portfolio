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
export const DEVAULT_PRESENTS_SLUG = "devault-presents";
export const BOUNCE_RADIO_SLUG = "bounce-radio";
export const STUDIO_ORRY_SLUG = "studio-orry";
export const MAMA_IN_YOUR_ABSENCE_SLUG = "mama-in-your-absence";

const EGWU_RECORDS: ProjectDefinition = {
  slug: EGWU_RECORDS_SLUG,
  number: "I",
  indexTotal: 6,
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
  indexTotal: 6,
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

const DEVAULT_PRESENTS: ProjectDefinition = {
  slug: DEVAULT_PRESENTS_SLUG,
  number: "III",
  indexTotal: 6,
  title: "DEVAULT PRESENTS",
  description:
    "Ongoing graphic design and art direction for Devault Presents, a Nigerian pop culture podcast and its parent brand Devault Magazine. The identity spans bold logos, episode-specific poster art, and the Devault Settings playlist series, pulling from cassette culture, vinyl sleeves, and retro print references for each drop.",
  sidebarActiveLabel: "design",
  sectionLinks: [
    { id: "logo", label: "Logo,", color: "#488bdc" },
    { id: "posters", label: "Posters,", color: "#019f4b" },
    { id: "playlist-cover", label: "Playlist Cover Art,", color: "#fe5418" },
    { id: "podcast-cover", label: "Podcast Cover Art,", color: "#f9b109" },
  ],
  sections: [
    { id: "logo", title: "Logo" },
    { id: "posters", title: "Posters" },
    { id: "playlist-cover", title: "Playlist Cover Art" },
    { id: "podcast-cover", title: "Podcast Cover Art" },
  ],
};

const STUDIO_ORRY: ProjectDefinition = {
  slug: STUDIO_ORRY_SLUG,
  number: "V",
  indexTotal: 6,
  title: "STUDIO ORRY",
  description:
    "Exhibition flyer and prop currency design for A wà ńbẹ̀, a solo exhibition by Nigerian artist Orry Shenjobi at the European Cultural Centre, Venice, as part of the 60th Venice Biennale. The show documents the Nigerian Owambe party through collage, photography, and mixed media, including a fictional Central Bank of Fàáji note nodding to the culture of \"spraying\" money at these celebrations.",
  sidebarActiveLabel: "design",
  sectionLinks: [
    { id: "exhibition-poster", label: "Exhibition Poster,", color: "#488bdc" },
    { id: "prop-currency", label: "Prop Currency Design,", color: "#019f4b" },
  ],
  sections: [
    { id: "exhibition-poster", title: "Exhibition Poster" },
    { id: "prop-currency", title: "Prop Currency Design" },
  ],
};

const MAMA_IN_YOUR_ABSENCE: ProjectDefinition = {
  slug: MAMA_IN_YOUR_ABSENCE_SLUG,
  number: "VI",
  indexTotal: 6,
  title: "MAMA, IN YOUR ABSENCE",
  description:
    "Postcard and poster design for Mama, in Your Absence, an interactive documentary by Muna Nzeribe, screened at ARTSPACE TMU as part of DOC NOW 2025, June 5th–21st. Designed as a keepsake for viewers, the postcard uses a mosaic, woven-photo treatment of archival family imagery paired with a QR code linking viewers to watch the documentary from home on PC or Mac.",
  sidebarActiveLabel: "design",
  sectionLinks: [
    { id: "postcard", label: "Postcard,", color: "#488bdc" },
    { id: "poster", label: "Poster,", color: "#019f4b" },
  ],
  sections: [
    { id: "postcard", title: "Postcard" },
    { id: "poster", title: "Poster" },
  ],
};

const BOUNCE_RADIO: ProjectDefinition = {
  slug: BOUNCE_RADIO_SLUG,
  number: "IV",
  indexTotal: 6,
  title: "BOUNCE RADIO",
  description:
    "Article and playlist cover art for Bounce Networks, a Lagos-based digital media platform covering youth culture through Afrobeats, sports, and cultural events. Pulling from halftone screen-print textures and retro radio and cassette references, the work spans editorial covers for features and event recaps alongside a running series of genre and mood-based playlist art.",
  sidebarActiveLabel: "design",
  sectionLinks: [
    { id: "playlist-cover", label: "Playlist Covers,", color: "#488bdc" },
    { id: "article-cover", label: "Article Cover Art,", color: "#019f4b" },
  ],
  sections: [
    { id: "playlist-cover", title: "Playlist Covers" },
    { id: "article-cover", title: "Article Cover Art" },
  ],
};

export const PROJECTS: Record<string, ProjectDefinition> = {
  [EGWU_RECORDS_SLUG]: EGWU_RECORDS,
  [DOC_NOW_SLUG]: DOC_NOW_2025,
  [DEVAULT_PRESENTS_SLUG]: DEVAULT_PRESENTS,
  [BOUNCE_RADIO_SLUG]: BOUNCE_RADIO,
  [STUDIO_ORRY_SLUG]: STUDIO_ORRY,
  [MAMA_IN_YOUR_ABSENCE_SLUG]: MAMA_IN_YOUR_ABSENCE,
};

export const PROJECTS_BY_NUMBER: Partial<Record<string, string>> = {
  I: EGWU_RECORDS_SLUG,
  II: DOC_NOW_SLUG,
  III: DEVAULT_PRESENTS_SLUG,
  IV: BOUNCE_RADIO_SLUG,
  V: STUDIO_ORRY_SLUG,
  VI: MAMA_IN_YOUR_ABSENCE_SLUG,
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
  "select works",
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

/** Default resting poster in reference: green postage-stamp (poster-06) — last in strip. */
export const EGWU_POSTERS_INITIAL_INDEX = 5;

export const EGWU_POSTERS: CoverFlowItem[] = [
  {
    src: "/projects/egwu/posters/poster-01.webp",
    alt: "EGWÚ and Friends London lineup poster with DJ illustration",
    width: 1080,
    height: 1350,
    label: "EGWÚ and Friends London",
  },
  {
    src: "/projects/egwu/posters/poster-02.webp",
    alt: "EGWÚ Community Event poster with modular red and magenta grid layout",
    width: 1080,
    height: 1350,
    label: "EGWÚ Community Event",
  },
  {
    src: "/projects/egwu/posters/poster-05.webp",
    alt: "EGWÚ Vinyl Festival poster with Sir Shina Peters and sunburst typography",
    width: 1080,
    height: 1351,
    label: "EGWÚ Vinyl Festival",
  },
  {
    src: "/projects/egwu/posters/poster-04.webp",
    alt: "EGWÚ Records Focus on the Physical poster with pink grain on black",
    width: 1080,
    height: 1350,
    label: "Focus on the Physical",
  },
  {
    src: "/projects/egwu/posters/poster-03.webp",
    alt: "EGWÚ Groove Sessions poster with vinyl-record head illustration",
    width: 1080,
    height: 1080,
    label: "EGWÚ Groove Sessions",
  },
  {
    src: "/projects/egwu/posters/poster-06.webp",
    alt: "EGWÚ Records event poster with green postage-stamp frame and EGWÚ and Friends February event",
    width: 1080,
    height: 1283,
    label: "Green postage-stamp poster",
  },
];

/** Default resting item in reference: black tee with green stamp graphic. */
export const EGWU_MERCHANDISE_INITIAL_INDEX = 0;

export const EGWU_MERCH_SHIRTS: CoverFlowItem[] = [
  {
    src: "/projects/egwu/merchandise/tshirt-black-front.webp",
    alt: "Black EGWÚ Records t-shirt with postage-stamp graphic on the front",
    width: 2000,
    height: 2000,
    label: "Black t-shirt with green stamp",
  },
  {
    src: "/projects/egwu/merchandise/tshirt-black-back.webp",
    alt: "Black EGWÚ Records t-shirt back view",
    width: 2000,
    height: 2000,
    label: "Black t-shirt back",
  },
  {
    src: "/projects/egwu/merchandise/tshirt-white.webp",
    alt: "White EGWÚ Records t-shirt with blue chest graphic",
    width: 2000,
    height: 2000,
    label: "White t-shirt",
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
];

export const EGWU_MERCH_BANDANAS: CoverFlowItem[] = [
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

export const EGWU_MERCHANDISE: CoverFlowItem[] = [
  ...EGWU_MERCH_SHIRTS,
  ...EGWU_MERCH_BANDANAS,
];

export const EGWU_COLORS = {
  src: "/projects/egwu/colors-palette.webp",
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

/** Desktop board order: Donor Package → Bake Sale → film-strip. */
export const DOC_NOW_POSTERS_BOARD: CoverFlowItem[] = [
  DOC_NOW_POSTERS[2],
  DOC_NOW_POSTERS[1],
  DOC_NOW_POSTERS[0],
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
    width: 1280,
    height: 722,
    kind: "video",
  },
  {
    src: docNowSrc("Website design/WEBSITE-RECORDING-MOBILE.mp4"),
    alt: "DOC NOW 2025 website mobile recording",
    width: 634,
    height: 1280,
    kind: "video",
  },
];

const DEVAULT_DIR = "/projects/DEVAULT PRESENTS";

function devaultSrc(relativePath: string) {
  return `${DEVAULT_DIR}/${relativePath}`;
}

export const DEVAULT_LOGOS = [
  {
    src: devaultSrc("Logo/DP LOGO 2.webp"),
    alt: "Devault Presents sans-serif wordmark on black",
    width: 1788,
    height: 233,
  },
] as const;

export const DEVAULT_POSTERS: CoverFlowItem[] = [
  {
    src: devaultSrc("Posters/ EPISODE 1.webp"),
    alt: "Devault Presents episode 1 poster",
    width: 1080,
    height: 1350,
  },
  {
    src: devaultSrc("Posters/EPISODE 3.webp"),
    alt: "Devault Presents episode 3 poster",
    width: 1080,
    height: 1350,
  },
  {
    src: devaultSrc("Posters/EPISODE 4.webp"),
    alt: "Devault Presents episode 4 poster",
    width: 1080,
    height: 1350,
  },
  {
    src: devaultSrc("Posters/EPISODE 5.webp"),
    alt: "Devault Presents episode 5 poster",
    width: 1080,
    height: 1350,
  },
  {
    src: devaultSrc("Posters/EPISODE 6.webp"),
    alt: "Devault Presents episode 6 poster",
    width: 1080,
    height: 1350,
  },
  {
    src: devaultSrc("Posters/EPISODE 7.webp"),
    alt: "Devault Presents episode 7 poster",
    width: 1080,
    height: 1350,
  },
  {
    src: devaultSrc("Posters/DP SEASON 2 EPISODE 1.webp"),
    alt: "Devault Presents season 2 episode 1 poster",
    width: 1080,
    height: 1350,
  },
  {
    src: devaultSrc("Posters/DP S02E03.webp"),
    alt: "Devault Presents season 2 episode 3 poster",
    width: 1080,
    height: 1350,
  },
  {
    src: devaultSrc("Posters/DP WTF is Going ON 1.webp"),
    alt: "Devault Presents WTF is Going On poster",
    width: 1080,
    height: 1350,
  },
];

export const DEVAULT_PLAYLIST: CoverFlowItem[] = [
  {
    src: devaultSrc("Playlist Cover Art/DS OO1 PLAYLIST COVER.webp"),
    alt: "Devault Settings 001 playlist cover",
    width: 1000,
    height: 1000,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 001 PLAYLIST LIST.webp"),
    alt: "Devault Settings 001 tracklist",
    width: 2000,
    height: 1000,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 002 v1.webp"),
    alt: "Devault Settings 002 playlist cover",
    width: 5000,
    height: 5000,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 002 V2.webp"),
    alt: "Devault Settings 002 playlist cover alternate",
    width: 5000,
    height: 5000,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 002 TRACKLIST.webp"),
    alt: "Devault Settings 002 tracklist",
    width: 2000,
    height: 1000,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 003 II.webp"),
    alt: "Devault Settings 003 playlist cover",
    width: 1000,
    height: 1000,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 003 TRACKLIST.webp"),
    alt: "Devault Settings 003 tracklist",
    width: 2000,
    height: 1000,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 004.webp"),
    alt: "Devault Settings 004 playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 004 TRACKLIST.webp"),
    alt: "Devault Settings 004 tracklist",
    width: 2160,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 005.webp"),
    alt: "Devault Settings 005 playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 005 TRACKLIST.webp"),
    alt: "Devault Settings 005 tracklist",
    width: 2159,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 006.webp"),
    alt: "Devault Settings 006 playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 006 TRACKLIST 2.webp"),
    alt: "Devault Settings 006 tracklist",
    width: 1530,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS OO7 PLAYLIST COVER.webp"),
    alt: "Devault Settings 007 playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 007 PLAYLIST LIST.webp"),
    alt: "Devault Settings 007 tracklist",
    width: 2160,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS OO8 PLAYLIST COVER.webp"),
    alt: "Devault Settings 008 playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 008 PLAYLIST LIST.webp"),
    alt: "Devault Settings 008 tracklist",
    width: 2160,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS OO9 PLAYLIST COVER.webp"),
    alt: "Devault Settings 009 playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 009 PLAYLIST LIST.webp"),
    alt: "Devault Settings 009 tracklist",
    width: 2160,
    height: 1080,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS O11 PLAYLIST COVER.webp"),
    alt: "Devault Settings 011 playlist cover",
    width: 4096,
    height: 4096,
  },
  {
    src: devaultSrc("Playlist Cover Art/DS 011 PLAYLIST LIST.webp"),
    alt: "Devault Settings 011 tracklist",
    width: 2160,
    height: 1080,
  },
];

export const DEVAULT_PODCAST: CoverFlowItem[] = [
  {
    src: devaultSrc("Podcast Cover Art/Podcast Cover 1.webp"),
    alt: "Devault Presents podcast cover 1",
    width: 1080,
    height: 1080,
  },
  {
    src: devaultSrc("Podcast Cover Art/Podcast Cover 2.webp"),
    alt: "Devault Presents podcast cover 2",
    width: 1080,
    height: 1080,
  },
  {
    src: devaultSrc("Podcast Cover Art/2022 RECAP.webp"),
    alt: "Devault Presents 2022 Recap podcast cover",
    width: 1000,
    height: 1000,
  },
  {
    src: devaultSrc("Podcast Cover Art/Podcast Cover 3.webp"),
    alt: "Devault Presents podcast cover 3",
    width: 1080,
    height: 1080,
  },
];

const BOUNCE_DIR = "/projects/BOUNCE RADIO";

function bounceSrc(relativePath: string) {
  return `${BOUNCE_DIR}/${relativePath}`;
}

export type BounceArticleSlide = {
  id: string;
  wide: CoverFlowItem;
  square: CoverFlowItem;
};

function bounceArticleCover(
  n: number,
  alt: string,
  width: number,
  height: number,
): CoverFlowItem {
  return {
    src: bounceSrc(`Article Cover Art/BARTICLECOVER${n}.webp`),
    alt,
    width,
    height,
  };
}

export const BOUNCE_ARTICLE_SLIDES: BounceArticleSlide[] = [
  {
    id: "layi-wasabi",
    wide: bounceArticleCover(
      1,
      "Layi Wasabi: The Subtle Genius of Nigerian Skit-Making landscape article cover",
      1800,
      800,
    ),
    square: bounceArticleCover(
      3,
      "Layi Wasabi: The Subtle Genius of Nigerian Skit-Making square article cover",
      1080,
      1080,
    ),
  },
  {
    id: "burna-boy",
    wide: bounceArticleCover(
      4,
      "Burna Boy genre-shift landscape article cover",
      1800,
      800,
    ),
    square: bounceArticleCover(
      6,
      "Burna Boy genre-shift square article cover",
      1080,
      1080,
    ),
  },
  {
    id: "bbnaija",
    wide: bounceArticleCover(
      7,
      "Big Brother Naija landscape article cover",
      1800,
      800,
    ),
    square: bounceArticleCover(
      9,
      "Big Brother Naija square article cover",
      1080,
      1080,
    ),
  },
  {
    id: "airport",
    wide: bounceArticleCover(
      12,
      "Bounce Radio Independence Day landscape article cover",
      1800,
      800,
    ),
    square: bounceArticleCover(
      10,
      "Bounce Radio Independence Day square article cover",
      1080,
      1080,
    ),
  },
  {
    id: "spotify-plane",
    wide: bounceArticleCover(
      14,
      "Bounce Radio Spotify Afrobeats landscape article cover",
      1800,
      800,
    ),
    square: bounceArticleCover(
      15,
      "Bounce Radio Spotify Afrobeats square article cover",
      1080,
      1080,
    ),
  },
  {
    id: "spotify-takeaways",
    wide: bounceArticleCover(
      17,
      "Takeaways from Spotify’s Journey of Afrobeats Eventent landscape article cover",
      1800,
      800,
    ),
    square: bounceArticleCover(
      18,
      "Takeaways from Spotify’s Journey of Afrobeats Eventent square article cover",
      1080,
      1080,
    ),
  },
];

export const BOUNCE_ARTICLE_WIDE = BOUNCE_ARTICLE_SLIDES.map((slide) => slide.wide);
export const BOUNCE_ARTICLE_SQUARE = BOUNCE_ARTICLE_SLIDES.map((slide) => slide.square);

export const BOUNCE_PLAYLIST_COVERS: CoverFlowItem[] = [
  {
    src: bounceSrc("Playlist Covers/Artboard 1.webp"),
    alt: "Bounce Radio Riddim Radio playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: bounceSrc("Playlist Covers/Artboard 2.webp"),
    alt: "Bounce Radio Nu Groove Sound playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: bounceSrc("Playlist Covers/Artboard 3.webp"),
    alt: "Bounce Radio New Music Premiere playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: bounceSrc("Playlist Covers/Artboard 4.webp"),
    alt: "Bounce Radio Musik Konfidential playlist cover",
    width: 1080,
    height: 1080,
  },
  {
    src: bounceSrc("Playlist Covers/Artboard 5.webp"),
    alt: "Bounce Radio Grime & Tings playlist cover",
    width: 1080,
    height: 1080,
  },
];

const ORRY_DIR = "/projects/STUDIO ORRY";

function orrySrc(relativePath: string) {
  return `${ORRY_DIR}/${relativePath}`;
}

export const ORRY_FLYERS: CoverFlowItem[] = [
  {
    src: orrySrc("Exhibition Flyer Design/exhibition-flyer-front.jpg"),
    alt: "A wà ńbẹ̀ exhibition flyer vinyl, front",
    width: 1500,
    height: 1500,
  },
  {
    src: orrySrc("Exhibition Flyer Design/exhibition-flyer-back.jpg"),
    alt: "A wà ńbẹ̀ exhibition flyer vinyl, back",
    width: 1500,
    height: 1500,
  },
];

export const ORRY_CURRENCY = [
  {
    src: orrySrc("Prop Currency Design/ORRY MONEY V2.webp"),
    alt: "Central Bank of Fàáji prop currency note, front",
    width: 1756,
    height: 880,
  },
  {
    src: orrySrc("Prop Currency Design/ORRY MONEY BACK V2.webp"),
    alt: "Central Bank of Fàáji prop currency note, back",
    width: 1744,
    height: 880,
  },
] as const;

const MAMA_DIR = "/projects/MAMA, IN YOUR ABSENCE";

function mamaSrc(relativePath: string) {
  return `${MAMA_DIR}/${relativePath}`;
}

export const MAMA_POSTCARD_MOCKUP = {
  src: mamaSrc("Postcard/mama-postcard.jpg"),
  alt: "Mama, in Your Absence postcard in a vellum envelope, with woven portrait and QR code",
  width: 2500,
  height: 3128,
} as const;

export const MAMA_POSTCARD_FRONT = {
  src: mamaSrc("Postcard/postcard-front.jpg"),
  alt: "Mama, in Your Absence postcard front, with woven archival portrait",
  width: 1481,
  height: 2074,
} as const;

export const MAMA_POSTCARD_BACK = {
  src: mamaSrc("Postcard/postcard-back.jpg"),
  alt: "Mama, in Your Absence postcard back, with QR code and POST CARD",
  width: 2962,
  height: 4148,
} as const;

export const MAMA_POSTER = {
  src: mamaSrc("Poster/artspace-poster.jpg"),
  alt: "Mama, in Your Absence poster for ARTSPACE TMU and DOC NOW 2025",
  width: 1481,
  height: 2074,
} as const;

