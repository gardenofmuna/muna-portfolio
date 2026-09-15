import { ABOUT_BIO_INK } from "@/components/AboutBio";

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
};

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
    width: 2880,
    height: 1626,
    alt: "Mama, in Your Absence installation view",
    titleColor: ABOUT_BIO_INK.interdisciplinary,
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
    width: 5712,
    height: 4284,
    alt: "OGUTA - LAGOS - TORONTO at Artspace TMU",
    titleColor: ABOUT_BIO_INK.blue,
  },
  {
    id: "akuabata-2024",
    year: "2024",
    kind: "Group Exhibition",
    titleLines: ["Akuabata.", "Nkiruka."],
    venueLines: ["+234 Art Fair at", "Ecobank Pan-African Centre"],
    src: "/Akuabata-Nkiruka.png",
    width: 1920,
    height: 1080,
    alt: "Akuabata. Nkiruka. at +234 Art Fair",
    titleColor: ABOUT_BIO_INK.medium,
  },
] as const;
