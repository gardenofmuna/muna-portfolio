import { ABOUT_BIO_INK } from "@/components/AboutBio";

/** Vinyl orange used across Efuru at the Threshold (#F75701). */
export const EFURU_ORANGE = "#F75701";

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
  /** Exhibition chapters, rendered after the gallery. */
  chapters?: readonly InstallationChapter[];
  /** Shared credit printed under every archive caption. */
  archiveCredit?: string;
};

/** A wall quote set as type in the exhibition's vinyl style (no photo of the vinyl). */
export type InstallationVinylQuote = {
  text: string;
  /**
   * How the quote sat on the wall: "panel" = white type on the orange quote
   * wall, "orange" = orange vinyl on white, "black" = black vinyl on white.
   */
  tone?: "panel" | "orange" | "black";
  /**
   * The quote as printed: a fixed composition (line breaks, proportions)
   * that scales with the page instead of rewrapping. Width/height in mm.
   */
  print?: { src: string; width: number; height: number; type: number };
  /** Credit lines, smallest type. First line is the attribution. */
  credit: readonly string[];
};

/** A scan of an exhibited object with the wording of its wall label. */
export type InstallationArchiveItem = {
  image: InstallationGalleryImage;
  /** Label title, as printed on the wall. */
  title: string;
  /** Date line, e.g. "1953" or "Undated". */
  date: string;
  /** Maker and medium lines, e.g. "Photographer unknown", "Photograph, colour". */
  lines?: readonly string[];
};

/** One chapter of an exhibition: vinyl quotes, then what hung there. */
export type InstallationChapter = {
  number: string;
  title: string;
  quotes: readonly InstallationVinylQuote[];
  /** Installation views placed after the chapter's opening quote. */
  views?: readonly InstallationGalleryImage[];
  /** Captioned scans of what was shown in this chapter. */
  archive?: readonly InstallationArchiveItem[];
  /** Horizontal strip (e.g. vitrine objects). */
  strip?: readonly InstallationGalleryImage[];
  stripCaption?: string;
  /** Quote that closes the chapter, after its images. */
  closingQuote?: InstallationVinylQuote;
  /**
   * Hand-placed rows on the 12-column grid. Cells name any picture or quote
   * on the page by file name ("pmgs-staff-1953", "wall-making-full",
   * "vinyl-c") or "slideshow", plus the first column and the columns spanned.
   */
  rows?: readonly InstallationGridRow[];
};

export type InstallationGridRow = {
  /** "top": tops line up (quote beside a picture). "bottom": pictures stand
   *  on one line so their labels start together. */
  align: "top" | "bottom";
  /** edge "end": a quote sits against the right edge of its columns. */
  cells: readonly { ref: string; col: number; span: number; edge?: "end" }[];
  /** Columns on phones (default 1). */
  mobileCols?: 1 | 2 | 3;
  /** One caption for the whole row, set under it. */
  caption?: string;
  /** Small prints: show every picture in the row at this one height (px),
   *  never larger than its file holds up at. */
  printHeight?: number;
};

export type InstallationShow = {
  id: string;
  year: string;
  kind: string;
  /** Title as set on the page, line by line (fitted to the column). */
  titleLines: readonly string[];
  venueLines: readonly string[];
  src: string;
  width: number;
  height: number;
  alt: string;
  titleColor: string;
  /** Full detail page — same layout/logic for every show. */
  caseStudy: InstallationCaseStudy;
  /** Search result description (defaults to the first paragraph). */
  seoDescription?: string;
  /** Facts for search engines (schema.org ExhibitionEvent). */
  event?: {
    startDate: string;
    endDate?: string;
    venue: string;
    address?: { locality: string; country: string };
    organizer?: string;
    about?: readonly Record<string, unknown>[];
  };
};

/**
 * Installation shows — newest first.
 * Desktop carousel and mobile feed both render `src` from this list so the
 * image choices stay identical across layouts.
 */
export const INSTALLATION_SHOWS: readonly InstallationShow[] = [
  {
    id: "efuru-2026",
    year: "2026",
    kind: "Curated Exhibition",
    titleLines: ["Flora Nwapa:", "Efuru at the", "Threshold"],
    venueLines: ["Àrokò Literary Arts at", "DIDI Museum, Lagos"],
    src: "/installation/efuru/hero.webp",
    width: 1440,
    height: 813,
    alt: "Flora Nwapa: Efuru at the Threshold, the quote wall between two vitrines at DIDI Museum",
    titleColor: EFURU_ORANGE,
    seoDescription:
      "Flora Nwapa: Efuru at the Threshold, curated by Muna Nzeribe for Àrokò Literary Arts at DIDI Museum, Lagos, 24 to 31 October 2026, for sixty years of Efuru.",
    event: {
      startDate: "2026-10-24",
      endDate: "2026-10-31",
      venue: "DIDI Museum",
      address: { locality: "Lagos", country: "NG" },
      organizer: "Àrokò Literary Arts",
      about: [
        { "@type": "Person", name: "Flora Nwapa" },
        { "@type": "Book", name: "Efuru", datePublished: "1966", author: { "@type": "Person", name: "Flora Nwapa" } },
      ],
    },
    caseStudy: {
      paragraphs: [
        "I curated Flora Nwapa: Efuru at the Threshold as the inaugural exhibition of Àrokò Literary Arts, held at DIDI Museum in Lagos from 24 to 31 October 2026 to mark sixty years of Efuru, the first novel to be published by an African woman in English, Flora Nwapa.",
        "The exhibition traced the journey of Efuru across four chapters: Making, Object, Reader and Memory. Editions of the novel and the works that followed sat alongside photographs, personal artefacts, moving image, sound and a growing collage of reader responses, bringing the research process into view. From the family archive emerged unpublished manuscripts, diaries and the typescript of Nwapa's final novel. At the heart of the exhibition was my interactive documentary [Mama, in Your Absence](/installation/mama-2025) (2025).",
      ],
      galleryColumns: 2,
      galleryCaption: "DIDI Museum, Lagos, October 2026",
      gallery: [
        { src: "/installation/efuru/room-1.webp", width: 1920, height: 1280, alt: "The quote wall and vitrines" },
        { src: "/installation/efuru/room-2.webp", width: 1920, height: 1280, alt: "View across the gallery to the desk and the Reader wall" },
      ],
      archiveCredit: "Courtesy of the family of Flora Nwapa",
      chapters: [
        {
          number: "01",
          title: "Making",
          quotes: [{ print: { src: "/installation/efuru/vinyl-c.svg", width: 670.3, height: 855.0, type: 49 }, tone: "orange", text: "“So I went on and on and on and wrote Efuru. I got it typed and thought it wasn’t a bad story, but I didn’t have the courage to give it to anybody, to read. Then I gave it to Chinua Achebe … And once your book is accepted for publication, you become a writer! … The first African woman to have a novel published by Heinemann of London … I made history!”", credit: ["Flora Nwapa, interviewed for NRK television, Norway, 1987", "As quoted in Paula Uimonen, Invoking Flora Nwapa: Nigerian Women Writers, Femininity and Spirituality in World Literature, 2020"] }],
          views: [
            { src: "/installation/efuru/wall-making-full.webp", width: 1800, height: 2400, alt: "Framed photographs on the Making wall" },
            { src: "/installation/efuru/ss-making-pair.webp", width: 1800, height: 2400, alt: "Framed photographs and labels on the Making wall" },
            { src: "/installation/efuru/panel-portrait-10.webp", width: 1757, height: 2400, alt: "Portrait of Flora Nwapa, printed panel" },
            { src: "/installation/efuru/panel-portrait-8.webp", width: 1757, height: 2400, alt: "Portrait of Flora Nwapa in three-quarter view, printed panel" },
            { src: "/installation/efuru/panel-at-her-desk.webp", width: 1757, height: 2400, alt: "Flora Nwapa on the telephone at her desk, printed panel" },
          ],
          rows: [
            { align: "top", mobileCols: 3, cells: [{ ref: "panel-portrait-10", col: 1, span: 4 }, { ref: "panel-at-her-desk", col: 5, span: 4 }, { ref: "panel-portrait-8", col: 9, span: 4 }], caption: "Portraits of Flora Nwapa. Photographer unknown. Date unknown. Courtesy of Nwapa’s family." },
            { align: "top", mobileCols: 2, cells: [{ ref: "vinyl-c", col: 1, span: 4 }, { ref: "wall-making-full", col: 5, span: 4 }, { ref: "ss-making-pair", col: 9, span: 4 }] },
            { align: "bottom", cells: [{ ref: "pmgs-staff-1953", col: 1, span: 4 }, { ref: "children-bw", col: 5, span: 4 }, { ref: "husband-gogo-nwakuche", col: 9, span: 4 }] },
          ],
          archive: [
            { image: { src: "/installation/efuru/pmgs-staff-1953.webp", width: 1800, height: 1152, alt: "Flora Nwapa with the staff of Priscilla Memorial Grammar School (PMGS), Oguta" }, title: "Flora Nwapa with the staff of Priscilla Memorial Grammar School (PMGS), Oguta", date: "1953", lines: ["Photographer unknown", "Photograph, black and white"] },
            { image: { src: "/installation/efuru/children-bw.webp", width: 1600, height: 1099, alt: "Flora Nwapa with her children Uzoma and Amede" }, title: "Flora Nwapa with her children Uzoma and Amede", date: "Undated", lines: ["Photographer unknown", "Photograph, black and white"] },
            { image: { src: "/installation/efuru/husband-gogo-nwakuche.webp", width: 1800, height: 1357, alt: "Flora Nwapa with her husband, Gogo Nwakuche" }, title: "Flora Nwapa with her husband, Gogo Nwakuche", date: "Undated", lines: ["Photographer unknown", "Photograph, black and white"] },
            { image: { src: "/installation/efuru/children-1981.webp", width: 581, height: 749, alt: "Flora Nwapa with her children: Uzoma (top), with Ejine and Amede to her left" }, title: "Flora Nwapa with her children: Uzoma (top), with Ejine and Amede to her left", date: "1981", lines: ["Photographer unknown", "Photograph, colour"] },
            { image: { src: "/installation/efuru/sisters.webp", width: 363, height: 262, alt: "Flora Nwapa with her sisters Bee and Ogedi" }, title: "Flora Nwapa with her sisters Bee and Ogedi", date: "Undated", lines: ["Photographer unknown", "Photograph, colour"] },
          ],
        },
        {
          number: "02",
          title: "Object",
          quotes: [{ print: { src: "/installation/efuru/vinyl-v2.svg", width: 215.1, height: 275.8, type: 25.5 }, tone: "black", text: "“Efuru was her name. She was a remarkable woman. It was not only that she came from a distinguished family. She was distinguished herself.”", credit: ["Efuru (1966), p. 1"] }],
          strip: [
            { src: "/installation/efuru/ig-gallery-vitrines.webp", width: 2400, height: 1600, alt: "The orange quote wall between the vitrines" },
            { src: "/installation/efuru/ig-orange-wall.webp", width: 2400, height: 1600, alt: "Flora Nwapa’s words on the orange quote wall" },
            { src: "/installation/efuru/ig-gallery-view.webp", width: 2400, height: 1600, alt: "View across the gallery to the desk and the Reader wall" },
            { src: "/installation/efuru/ss-memory-wall.webp", width: 2400, height: 1601, alt: "The closing lines of Efuru beside the desk portrait" },
            { src: "/installation/efuru/ig-quote-made-history.webp", width: 1080, height: 1350, alt: "“I made history!” in orange vinyl" },
            { src: "/installation/efuru/ss-portrait-wall.webp", width: 2400, height: 1946, alt: "The portrait panel among framed photographs on the Reader wall" },
            { src: "/installation/efuru/wall-making-full.webp", width: 1800, height: 2400, alt: "Framed photographs on the Making wall" },
            { src: "/installation/efuru/wall-memory-full.webp", width: 2400, height: 1600, alt: "The collage wall of reader responses" },
            { src: "/installation/efuru/ss-collage-quote.webp", width: 2400, height: 1600, alt: "A collage quote among reader responses on the Memory wall" },
            { src: "/installation/efuru/ss-desk-piano.webp", width: 2400, height: 1600, alt: "The desk and piano, with the Making wall beyond" },
            { src: "/installation/efuru/ss-desk-books.webp", width: 2400, height: 1350, alt: "Efuru, Never Again and Wives at War on the desk" },
            { src: "/installation/efuru/ss-family-frames.webp", width: 2400, height: 1627, alt: "Family photographs on the Making wall" },
            { src: "/installation/efuru/ss-vitrine-mammywater.webp", width: 1350, height: 2400, alt: "Mammywater in a vitrine" },
            { src: "/installation/efuru/ss-vitrine-french.webp", width: 1800, height: 2400, alt: "Efuru: roman nigérian, the French translation" },
            { src: "/installation/efuru/ss-vitrine-efuru.webp", width: 1800, height: 2400, alt: "The first edition of Efuru (Heinemann, 1966) in a vitrine, with the typescript of Nkuma is Captain below" },
            { src: "/installation/efuru/ss-visitor.webp", width: 2400, height: 1350, alt: "A visitor at the Reader wall" },
            { src: "/installation/efuru/ss-making-pair.webp", width: 1800, height: 2400, alt: "Framed photographs and labels on the Making wall" },
            { src: "/installation/efuru/wall-reader-full.webp", width: 2400, height: 1350, alt: "The desk portrait panel flanked by framed photographs on the Reader wall" },
            { src: "/installation/efuru/ss-closing-quote.webp", width: 1982, height: 2400, alt: "The closing lines of Efuru in orange vinyl" },
            { src: "/installation/efuru/ig-quote-feminist.webp", width: 1080, height: 1350, alt: "“A feminist with a big ‘f’” in orange vinyl" },
          ],
          rows: [
            { align: "top", cells: [{ ref: "slideshow", col: 1, span: 12 }] },
          ],
        },
        {
          number: "03",
          title: "Reader",
          quotes: [{ print: { src: "/installation/efuru/vinyl-a.svg", width: 654.9, height: 563.7, type: 49 }, tone: "orange", text: "“When I do write about women in Nigeria, in Africa, I try to paint a positive picture about women because there are many women who are very, very positive in their thinking, who are very, very independent and very, very industrious.”", credit: ["Flora Nwapa, in conversation with Marie Umeh, 1995"] }, { print: { src: "/installation/efuru/vinyl-b.svg", width: 655.1, height: 916.9, type: 49 }, tone: "orange", text: "“I think that I will go all out and say that I am a feminist with a big ‘f’ because Obioma [Nnaemeka] said on Monday that feminism is about possibilities; there are possibilities, there are choices. Let us not be afraid to say that we are feminists. We need one another, we really need one another. Globally, we need one another.”", credit: ["Flora Nwapa, speaking at “Women in Africa and the African Diaspora: Bridges Across Activism and the Academy,” Nsukka, Nigeria, 13–18 July 1992", "As quoted in Obioma Nnaemeka, “Feminism, Rebellious Women, and Cultural Boundaries: Rereading Flora Nwapa and Her Compatriots,” Research in African Literatures, 1995"] }],
          views: [{ src: "/installation/efuru/wall-reader-full.webp", width: 2400, height: 1350, alt: "The desk portrait panel flanked by framed photographs on the Reader wall" }],
          archive: [
            { image: { src: "/installation/efuru/iowa.webp", width: 261, height: 323, alt: "Flora Nwapa presenting at the International Writing Program, University of Iowa" }, title: "Flora Nwapa presenting at the International Writing Program, University of Iowa", date: "Undated", lines: ["Photographer unknown", "Photograph, colour"] },
            { image: { src: "/installation/efuru/amsterdam-1.webp", width: 444, height: 303, alt: "Flora Nwapa with Zaynab Alkali and Grace Osifo at the 5th International Feminist Book Fair, Amsterdam" }, title: "Flora Nwapa with Zaynab Alkali and Grace Osifo at the 5th International Feminist Book Fair, Amsterdam", date: "1992", lines: ["Photographer unknown", "Photograph, colour"] },
            { image: { src: "/installation/efuru/amsterdam-2.webp", width: 437, height: 303, alt: "Flora Nwapa with Femi Kuti, Zaynab Alkali and Christy Essien-Igbokwe" }, title: "Flora Nwapa with Femi Kuti, Zaynab Alkali and Christy Essien-Igbokwe", date: "Undated", lines: ["Photographer unknown", "Photograph, colour"] },
            { image: { src: "/installation/efuru/buchi.webp", width: 442, height: 303, alt: "Flora Nwapa with Buchi Emecheta" }, title: "Flora Nwapa with Buchi Emecheta", date: "Undated", lines: ["Photographer unknown", "Photograph, colour"] },
            { image: { src: "/installation/efuru/ekwensi.webp", width: 1396, height: 720, alt: "Flora Nwapa with Cyprian Ekwensi" }, title: "Flora Nwapa with Cyprian Ekwensi", date: "Undated", lines: ["Photographer unknown", "Photograph, black and white"] },
            { image: { src: "/installation/efuru/mbadiwe.webp", width: 1600, height: 1160, alt: "Flora Nwapa with Emeka Mbadiwe at her book launch in Lagos" }, title: "Flora Nwapa with Emeka Mbadiwe at her book launch in Lagos", date: "Undated", lines: ["Photographer unknown", "Photograph, colour"] },
            { image: { src: "/installation/efuru/decoration-1987.webp", width: 1800, height: 1384, alt: "Flora Nwapa receiving a decoration from Amadi Ikwechegh, Governor of Imo State, for the Better Life Programme" }, title: "Flora Nwapa receiving a decoration from Amadi Ikwechegh, Governor of Imo State, for the Better Life Programme", date: "1987", lines: ["Photographer unknown", "Photograph, black and white"] },
            { image: { src: "/installation/efuru/commissioner-health.webp", width: 1040, height: 794, alt: "Flora Nwapa, as Commissioner for Health, visiting patients at the University of Nigeria Teaching Hospital, Enugu" }, title: "Flora Nwapa, as Commissioner for Health, visiting patients at the University of Nigeria Teaching Hospital, Enugu", date: "Undated", lines: ["Photographer unknown", "Photograph, black and white"] },
          ],
          rows: [
            { align: "top", cells: [{ ref: "vinyl-d", col: 1, span: 4 }, { ref: "wall-reader-full", col: 5, span: 8 }] },
            { align: "top", cells: [{ ref: "vinyl-b", col: 9, span: 4 }, { ref: "ekwensi", col: 1, span: 8 }] },
            { align: "bottom", cells: [{ ref: "mbadiwe", col: 1, span: 4 }, { ref: "decoration-1987", col: 5, span: 4 }, { ref: "commissioner-health", col: 9, span: 4 }] },
            { align: "bottom", mobileCols: 2, printHeight: 174, cells: [{ ref: "children-1981", col: 1, span: 3 }, { ref: "sisters", col: 4, span: 3 }, { ref: "iowa", col: 7, span: 3 }, { ref: "amsterdam-1", col: 10, span: 3 }] },
            { align: "bottom", mobileCols: 2, printHeight: 174, cells: [{ ref: "amsterdam-2", col: 1, span: 3 }, { ref: "buchi", col: 4, span: 3 }, { ref: "vinyl-v2", col: 10, span: 3 }, { ref: "grave", col: 7, span: 3 }] },
          ],
        },
        {
          number: "04",
          title: "Memory",
          quotes: [{ print: { src: "/installation/efuru/vinyl-v3.svg", width: 227.8, height: 260.7, type: 21.6 }, tone: "black", text: "“Have heart, my daughter. You are still young. It is still morning for you. So have heart. We cannot explain the mysteries of life, because we are mere human beings. Only God knows.”", credit: ["Efuru (1966), p. 91"] }, { print: { src: "/installation/efuru/vinyl-v1.svg", width: 216.8, height: 260.3, type: 24.0 }, tone: "black", text: "“She was not meant to suffer at all. Life for her meant living it fully. She did not want merely to exist. She wanted to live and use the world to her advantage.”", credit: ["Efuru (1966), p. 94"] }],
          views: [
            { src: "/installation/efuru/wall-memory-full.webp", width: 2400, height: 1600, alt: "The collage wall of reader responses" },
            { src: "/installation/efuru/ss-collage-quote.webp", width: 2400, height: 1600, alt: "Close-up of the collage wall: a quote among reader responses" },
            { src: "/installation/efuru/memory-visitors.webp", width: 2400, height: 1350, alt: "Visitors reading the collage wall of reader responses" },
            { src: "/installation/efuru/ss-desk-piano.webp", width: 2400, height: 1600, alt: "The desk and piano beneath “When I do write about women”" },
          ],
          archive: [
            { image: { src: "/installation/efuru/grave.webp", width: 374, height: 268, alt: "Ejine and Amede at Flora Nwapa's grave on the first anniversary of her death" }, title: "Ejine and Amede at Flora Nwapa's grave on the first anniversary of her death", date: "1994", lines: ["Photographer unknown", "Photograph, colour"] },
          ],
          rows: [
            { align: "top", cells: [{ ref: "vinyl-v3", col: 1, span: 4 }, { ref: "ss-collage-quote", col: 5, span: 8 }] },
            { align: "top", cells: [{ ref: "vinyl-v1", col: 9, span: 4, edge: "end" }, { ref: "memory-visitors", col: 1, span: 8 }] },
            { align: "top", cells: [{ ref: "vinyl-a", col: 1, span: 4 }, { ref: "ss-desk-piano", col: 5, span: 8 }] },
          ],
          closingQuote: { print: { src: "/installation/efuru/vinyl-d.svg", width: 653.2, height: 784.8, type: 49 }, tone: "orange", text: "“She dreamt of the woman of the lake, her beauty, her long hair and her riches. She had lived for ages at the bottom of the lake. She was as old as the lake itself. She was happy, she was wealthy. She was beautiful. She gave women beauty and wealth but she had no child. She had never experienced the joy of motherhood. Why then did the women worship her?”", credit: ["Flora Nwapa, Efuru (London: Heinemann, 1966), 281. The closing lines of the novel."] },
        },
      ],
    },
  },
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
    titleColor: ABOUT_BIO_INK.afro,
    event: {
      startDate: "2025",
      venue: "Artspace TMU",
      address: { locality: "Toronto", country: "CA" },
      organizer: "DOC NOW Festival 2025",
      about: [{ "@type": "Person", name: "Flora Nwapa" }],
    },
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
    event: {
      startDate: "2025",
      venue: "Artspace TMU",
      address: { locality: "Toronto", country: "CA" },
    },
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
    event: {
      startDate: "2024",
      venue: "Ecobank Pan-African Centre",
      address: { locality: "Lagos", country: "NG" },
      organizer: "+234 Art Fair",
    },
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
