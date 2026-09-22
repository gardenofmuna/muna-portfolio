import { ABOUT_BIO_INK } from "@/components/AboutBio";

export type InstallationGalleryImage = {
  /** Omit or leave empty when `placeholder` is true. */
  src?: string;
  width: number;
  height: number;
  alt: string;
  /** Gray shape stand-in until the real asset is dropped in. */
  placeholder?: boolean;
};

export type InstallationCaseStudy = {
  paragraphs: readonly string[];
  gallery: readonly InstallationGalleryImage[];
  largeCollage: InstallationGalleryImage;
  filmStill: InstallationGalleryImage;
  filmCaption: string;
};

export type InstallationShow = {
  id: string;
  year: string;
  kind: string;
  titleLines: readonly [string, string];
  venueLines: readonly string[];
  src: string;
  width: number;
  height: number;
  alt: string;
  titleColor: string;
  /** Full detail page — same layout/logic for every show. */
  caseStudy: InstallationCaseStudy;
};

/** Same section stack as Akuabata — copy/shapes until real assets land. */
function placeholderCaseStudy(
  title: string,
  opts?: { filmCaption?: string },
): InstallationCaseStudy {
  return {
    paragraphs: [
      `Placeholder body for ${title}. This paragraph mirrors the Akuabata detail layout — replace with the exhibition context, venue framing, and how the work sits in the show.`,
      `Second placeholder paragraph for ${title}. Swap this for the personal / archival through-line, materials, and what the work is asking. Keep two blocks so spacing matches the finished pages.`,
    ],
    gallery: [
      {
        placeholder: true,
        width: 900,
        height: 1200,
        alt: `${title} — gallery placeholder 1`,
      },
      {
        placeholder: true,
        width: 900,
        height: 1200,
        alt: `${title} — gallery placeholder 2`,
      },
      {
        placeholder: true,
        width: 900,
        height: 1200,
        alt: `${title} — gallery placeholder 3`,
      },
    ],
    largeCollage: {
      placeholder: true,
      width: 1600,
      height: 1160,
      alt: `${title} — large collage placeholder`,
    },
    filmStill: {
      placeholder: true,
      width: 1920,
      height: 1080,
      alt: `${title} — film still placeholder`,
    },
    filmCaption: opts?.filmCaption ?? `${title} — film caption placeholder`,
  };
}

/**
 * Installation shows — newest first.
 * Desktop: carousel slots. Narrow: vertical scroll feed.
 * Title colors cycle the design-list underline inks.
 * Titles are always exactly two lines.
 */
export const INSTALLATION_SHOWS: readonly InstallationShow[] = [
  {
    id: "mama-2025",
    year: "2025",
    kind: "Solo",
    titleLines: ["Mama,", "in Your Absence"],
    venueLines: ["DOC NOW 2025 at", "Artspace TMU"],
    src: "/MAMAINYOURABSENCE.webp",
    width: 1280,
    height: 722,
    alt: "Mama, in Your Absence installation view",
    titleColor: ABOUT_BIO_INK.interdisciplinary,
    caseStudy: placeholderCaseStudy("Mama, in Your Absence", {
      filmCaption: "Mama, in Your Absence — film caption placeholder",
    }),
  },
  {
    id: "oguta-2025",
    year: "2025",
    kind: "Group Exhibition",
    titleLines: ["OGUTA - LAGOS", "- TORONTO"],
    venueLines: [
      "Woven Together Fabrics of Belonging at",
      "Artspace TMU",
    ],
    src: "/OGUTA-LAGOS-TORONTO-2025.webp",
    width: 1280,
    height: 722,
    alt: "OGUTA - LAGOS - TORONTO at Artspace TMU",
    titleColor: ABOUT_BIO_INK.blue,
    caseStudy: placeholderCaseStudy("OGUTA - LAGOS - TORONTO", {
      filmCaption: "OGUTA - LAGOS - TORONTO — film caption placeholder",
    }),
  },
  {
    id: "akuabata-2024",
    year: "2024",
    kind: "Group Exhibition",
    titleLines: ["Akuabata.", "Nkiruka."],
    venueLines: ["+234 Art Fair at", "Ecobank Pan-African Centre"],
    src: "/Akuabata-Nkiruka.webp",
    width: 1280,
    height: 720,
    alt: "Akuabata. Nkiruka. at +234 Art Fair",
    titleColor: ABOUT_BIO_INK.medium,
    caseStudy: {
      paragraphs: [
        "My collage series Akuabata. Nkiruka. and short film Onyemaechi (Who Knows Tomorrow?) were exhibited in Ilé Lawà, the photography pavilion of the +234 Art Fair. The pavilion's title, Yoruba for “we are home, we are safe,” framed its exploration of home through the eyes of contemporary Nigerian artists.",
        "Akuabata. Nkiruka. pulls from my family archive, photographs of my mother and father alongside letters from my grandfather, to weave the past into the forward-looking promise held in its title: “wealth is coming” and “that to come is greater.” Onyemaechi, shot on 8mm from behind a window in Lagos, holds the city's wealth and poverty in the same frame, asking what tomorrow can mean when its potential has already been stolen. Together, the two works sit inside Ilé Lawà's central question: what does home hold onto when the ground beneath it keeps shifting?",
      ],
      gallery: [
        {
          src: "/installation/akuabata/gallery-corner.jpg",
          width: 1126,
          height: 1500,
          alt: "Ilé Lawà installation — OLED screening beside framed collages",
        },
        {
          src: "/installation/akuabata/gallery-person.jpg",
          width: 511,
          height: 683,
          alt: "Framed Akuabata. Nkiruka. collages on the gallery wall",
        },
        {
          src: "/installation/akuabata/gallery-frames.jpg",
          width: 1269,
          height: 1693,
          alt: "Visitors viewing Onyemaechi at Ilé Lawà",
        },
      ],
      largeCollage: {
        src: "/installation/akuabata/collage-large.webp",
        width: 6970,
        height: 5063,
        alt: "Akuabata. Nkiruka. collage with family archive and letter",
      },
      filmStill: {
        src: "/installation/akuabata/onyemaechi-still.jpg",
        width: 1920,
        height: 1080,
        alt: "Onyemaechi film still with subtitle",
      },
      filmCaption: "Onyemaechi - Who Knows Tomorrow? (2020)",
    },
  },
] as const;

export function getInstallationShowById(id: string) {
  return INSTALLATION_SHOWS.find((show) => show.id === id);
}

export function installationShowIndex(id: string) {
  return INSTALLATION_SHOWS.findIndex((show) => show.id === id);
}

export function neighborInstallationShow(id: string, delta: number) {
  const i = installationShowIndex(id);
  if (i < 0) return undefined;
  const n = INSTALLATION_SHOWS.length;
  return INSTALLATION_SHOWS[((i + delta) % n + n) % n];
}
