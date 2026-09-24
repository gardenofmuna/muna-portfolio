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
  /** Number of columns for the top gallery. Defaults to 3. */
  galleryColumns?: 2 | 3;
  /** Short label directly under the gallery (e.g. venue / year). */
  galleryCaption?: string;
  /** Optional note under the gallery (e.g. earlier-iteration credit). */
  galleryNote?: string;
  /** Design-page style horizontal scroll after the gallery. */
  horizontalStrip?: readonly InstallationGalleryImage[];
  /** Short label under the horizontal strip. */
  horizontalStripCaption?: string;
  largeCollage?: InstallationGalleryImage;
  filmStill?: InstallationGalleryImage;
  filmCaption?: string;
  /** When set, the film still shows a play control that opens this YouTube URL. */
  filmYoutubeUrl?: string;
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

/**
 * Installation shows — newest first.
 * Desktop carousel and mobile feed both render `src` from this list so the
 * image choices stay identical across layouts.
 */
export const INSTALLATION_SHOWS: readonly InstallationShow[] = [
  {
    id: "mama-2025",
    year: "2025",
    kind: "Solo",
    titleLines: ["Mama,", "in Your Absence"],
    venueLines: ["DOC NOW 2025 at", "Artspace TMU"],
    src: "/MAMAINYOURABSENCE.webp",
    width: 1440,
    height: 813,
    alt: "Mama, in Your Absence installation view",
    titleColor: ABOUT_BIO_INK.interdisciplinary,
    caseStudy: {
      paragraphs: [
        "My interactive web documentary Mama, In Your Absence ([mamainyourabsence.com](https://mamainyourabsence.com)) was presented as part of the 17th annual DOC NOW Festival, showcasing student-made film, photography, and installation work from Toronto Metropolitan University's Documentary Media MFA graduates.",
        "The project traces the literary legacy of my grandmother, Flora Nwapa, the first African woman to publish a novel in English, through archival materials, narrative letters, and mixed-media diaristic footage. It sets her legacy against the creative careers that followed it, mine, my mother's, and my sister's, turning intergenerational dialogue into a reflection on how Igbo women's stories are preserved, erased, or reimagined. Woven from personal and collective narrative, the piece challenges static archival portrayals of African women's legacies and asks how digital media can bridge past and present to keep that dialogue on legacy and identity evolving.",
      ],
      galleryColumns: 2,
      galleryCaption: "Artspace TMU, DOC NOW 2025",
      gallery: [
        {
          src: "/installation/mama/miya-1.webp",
          width: 1920,
          height: 1440,
          alt: "Mama, in Your Absence — installation view with interactive screens",
        },
        {
          src: "/installation/mama/miya-2.webp",
          width: 1600,
          height: 1956,
          alt: "Mama, in Your Absence — Polaroid of the DOC NOW installation",
        },
      ],
      horizontalStrip: [
        {
          src: "/installation/mama/miya-3.webp",
          width: 1600,
          height: 903,
          alt: "Mama, in Your Absence — interface frame 1",
        },
        {
          src: "/installation/mama/miya-4.webp",
          width: 1600,
          height: 903,
          alt: "Mama, in Your Absence — interface frame 2",
        },
        {
          src: "/installation/mama/miya-5.webp",
          width: 1600,
          height: 903,
          alt: "Mama, in Your Absence — interface frame 3",
        },
        {
          src: "/installation/mama/miya-6.webp",
          width: 1600,
          height: 902,
          alt: "Mama, in Your Absence — interface frame 4",
        },
        {
          src: "/installation/mama/miya-7.webp",
          width: 1600,
          height: 904,
          alt: "Mama, in Your Absence — interface frame 5",
        },
        {
          src: "/installation/mama/miya-8.webp",
          width: 1600,
          height: 901,
          alt: "Mama, in Your Absence — interface frame 6",
        },
        {
          src: "/installation/mama/miya-9.webp",
          width: 1600,
          height: 901,
          alt: "Mama, in Your Absence — interface frame 7",
        },
        {
          src: "/installation/mama/miya-10.webp",
          width: 1600,
          height: 902,
          alt: "Mama, in Your Absence — interface frame 8",
        },
        {
          src: "/installation/mama/miya-11.webp",
          width: 1600,
          height: 901,
          alt: "Mama, in Your Absence — interface frame 9",
        },
        {
          src: "/installation/mama/miya-12.webp",
          width: 1600,
          height: 900,
          alt: "Mama, in Your Absence — interface frame 10",
        },
        {
          src: "/installation/mama/miya-13.webp",
          width: 1600,
          height: 906,
          alt: "Mama, in Your Absence — interface frame 11",
        },
      ],
      horizontalStripCaption: "Web stills",
      filmStill: {
        src: "/installation/mama/miya-walkthrough-thumb.webp",
        width: 1600,
        height: 901,
        alt: "Mama, in Your Absence — web walkthrough",
      },
      filmCaption: "Web walkthrough",
      filmYoutubeUrl: "https://youtu.be/aCJyZ4OwX00",
    },
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
    width: 1440,
    height: 813,
    alt: "OGUTA - LAGOS - TORONTO at Artspace TMU",
    titleColor: ABOUT_BIO_INK.blue,
    caseStudy: {
      paragraphs: [
        "My installation Oguta-Lagos-Toronto was exhibited in Woven Together: Fabrics of Belonging, a group show alongside Mina Keykhaei and Azadeh Monzavi examining textiles' relationship to the spaces we inhabit, both public and personal, through a lens of feminism and social justice.",
        "The piece centers on my parents' wedding, a home video split between two ceremonies, the traditional Igbo wedding and the Catholic white wedding, projected through three oval frames set into a length of wax print fabric reminiscent of the textiles used by Catholic organizations in Nigeria. The Oguta and Lagos ovals hold the archival footage of the traditional wedding and white wedding respectively, while the Toronto oval carries a live camera feed of the room, imposing the spectator into the video as it oscillates between the traditional and white wedding footage playing behind them. That double ceremony, one rooted in indigenous custom and one inherited through colonization, is an allegory for globalization's pull on people existing within neo-colonial dynamics. Cultural hybridity becomes something the viewer is implicated in rather than simply observing.",
      ],
      gallery: [
        {
          src: "/installation/oguta/gallery-1.webp",
          width: 1200,
          height: 1600,
          alt: "Visitors seated at Oguta-Lagos-Toronto with live camera feed in the Toronto frame",
        },
        {
          src: "/installation/oguta/gallery-3.webp",
          width: 1200,
          height: 1600,
          alt: "Oguta-Lagos-Toronto installation view at Artspace TMU",
        },
        {
          src: "/installation/oguta/gallery-2.webp",
          width: 1200,
          height: 1600,
          alt: "Table setting and VHS camera in front of the three oval frames",
        },
      ],
      galleryNote:
        "An earlier iteration of Oguta-Lagos-Toronto was first shown as a prototype in Activating the Space (2024) a group exhibition at Toronto Metropolitan University's Image Factory.",
      largeCollage: {
        src: "/installation/oguta/collage-large.webp",
        width: 1920,
        height: 1280,
        alt: "Oguta-Lagos-Toronto prototype at Activating the Space, Image Factory, 2024",
      },
      filmStill: {
        src: "/installation/oguta/frames-detail.webp",
        width: 1500,
        height: 762,
        alt: "Close view of the Oguta, Toronto, and Lagos oval frames on wax print fabric",
      },
      filmCaption: "Oguta-Lagos-Toronto — oval frames with projected home video",
      filmYoutubeUrl: "https://youtu.be/LGSzYliUQ2I",
    },
  },
  {
    id: "akuabata-2024",
    year: "2024",
    kind: "Group Exhibition",
    titleLines: ["Akuabata.", "Nkiruka."],
    venueLines: ["+234 Art Fair at", "Ecobank Pan-African Centre"],
    src: "/Akuabata-Nkiruka.webp",
    width: 1440,
    height: 810,
    alt: "Akuabata. Nkiruka. at +234 Art Fair",
    titleColor: ABOUT_BIO_INK.medium,
    caseStudy: {
      paragraphs: [
        "My collage series Akuabata. Nkiruka. and short film Onyemaechi (Who Knows Tomorrow?) were exhibited in Ilé Lawà, the photography pavilion of the +234 Art Fair. The pavilion's title, Yoruba for “we are home, we are safe,” framed its exploration of home through the eyes of contemporary Nigerian artists.",
        "Akuabata. Nkiruka. pulls from my family archive, photographs of my mother and father alongside letters from my grandfather, to weave the past into the forward-looking promise held in its title: “wealth is coming” and “that to come is greater.” Onyemaechi, shot on 8mm from behind a window in Lagos, holds the city's wealth and poverty in the same frame, asking what tomorrow can mean when its potential has already been stolen. Together, the two works sit inside Ilé Lawà's central question: what does home hold onto when the ground beneath it keeps shifting?",
      ],
      gallery: [
        {
          src: "/installation/akuabata/gallery-corner.webp",
          width: 1126,
          height: 1500,
          alt: "Ilé Lawà installation — OLED screening beside framed collages",
        },
        {
          src: "/installation/akuabata/gallery-person.webp",
          width: 511,
          height: 683,
          alt: "Framed Akuabata. Nkiruka. collages on the gallery wall",
        },
        {
          src: "/installation/akuabata/gallery-frames.webp",
          width: 1199,
          height: 1600,
          alt: "Visitors viewing Onyemaechi at Ilé Lawà",
        },
      ],
      largeCollage: {
        src: "/installation/akuabata/collage-large.webp",
        width: 1920,
        height: 1395,
        alt: "Akuabata. Nkiruka. collage with family archive and letter",
      },
      filmStill: {
        src: "/installation/akuabata/onyemaechi-still.webp",
        width: 1920,
        height: 1080,
        alt: "Onyemaechi film still with subtitle",
      },
      filmCaption: "Onyemaechi - Who Knows Tomorrow? (2020)",
      filmYoutubeUrl: "https://youtu.be/_nrYfiS2UCY",
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
