export type CvEntry = {
  /** Date column, e.g. "23–25". `datesItalic` sets the trailing word in italics. */
  dates: string;
  datesItalic?: string;
  title: string;
  href?: string;
  lines: string[];
};

export type CvSection = {
  id: string;
  heading: string;
  column: "left" | "right";
  entries?: CvEntry[];
  list?: string[];
};

export const CV_NAME = "Munachiso Nzeribe";
export const CV_EMAIL = "munachinzeribe@gmail.com";
export const CV_SITE = { label: "www.munanzeribe.xyz", href: "https://munanzeribe.xyz" };
/** Printed from `/cv-print` (`npm run cv:pdf`) — rebuild after editing this file. */
export const CV_PDF = {
  href: "/Munachiso-Nzeribe-CV.pdf",
  filename: "Munachiso-Nzeribe-CV.pdf",
};

export const CV_SECTIONS: CvSection[] = [
  {
    id: "education",
    heading: "Education",
    column: "left",
    entries: [
      {
        dates: "23–25",
        title: "Toronto Metropolitan University",
        lines: [
          "Master of Fine Arts in Documentary Media",
          "Graduate Development Award (2023, 2024, 2025)",
          "Peter Twigge Memorial Scholarship (2024)",
          "Roger McTair Award (2024)",
        ],
      },
      {
        dates: "18–22",
        title: "Pan-Atlantic University, Lagos",
        lines: ["BSc, Mass Communication"],
      },
    ],
  },
  {
    id: "experience",
    heading: "Further Experience",
    column: "left",
    entries: [
      {
        dates: "06.26 –",
        datesItalic: "present",
        title: "Independent Curator",
        lines: [
          "DIDI Museum, Lagos, Nigeria",
          "Curating “Flora Nwapa: Efuru at the Threshold,” a retrospective marking the 60th anniversary of Efuru.",
        ],
      },
      {
        dates: "09.25 – 06.25",
        title: "Writing and Language Support Consultant",
        lines: [
          "Toronto Metropolitan University",
          "One-on-one and workshop support for undergraduate writing.",
        ],
      },
      {
        dates: "01.24 – 12.25",
        title: "Teaching Assistant",
        lines: [
          "Toronto Metropolitan University",
          "Course delivery across seven undergraduate and graduate classes.",
        ],
      },
      {
        dates: "09.24 – 07.25",
        title: "Visual Designer, Marketing Team | DOC NOW",
        lines: [
          "Toronto Metropolitan University",
          "Full visual identity across web, print, and digital.",
        ],
      },
      {
        dates: "02.23 – 08.23",
        title: "Marketing Manager",
        lines: [
          "WAFFLESNCREAM Ltd., Lagos",
          "Campaigns across website, newsletter, and social channels.",
        ],
      },
      {
        dates: "07.21 – 10.21",
        title: "Corporate Marketing Intern",
        lines: ["Lagos Business School", "Digital and print marketing materials."],
      },
      {
        dates: "02.19 – 01.21",
        title: "Tour Guide",
        lines: [
          "Yemisi Shyllon Museum, Lagos",
          "Museum tours and communications team content.",
        ],
      },
    ],
  },
  {
    id: "projects",
    heading: "Projects",
    column: "right",
    entries: [
      {
        dates: "",
        datesItalic: "ongoing",
        title: "Flora Nwapa: Efuru at the Threshold",
        lines: [
          "Retrospective exhibition marking the 60th anniversary of the novel Efuru. Curated by Muna Nzeribe.",
          "DIDI Museum, Lagos, Nigeria.",
        ],
      },
      {
        dates: "23–25",
        title: "Mama, in Your Absence",
        lines: [
          "Interactive web documentary exploring the literary and familial legacy of Flora Nwapa. MFA thesis, Toronto Metropolitan University.",
        ],
      },
      {
        dates: "24–25",
        title: "Oguta-Lagos-Toronto",
        lines: [
          "Installation built from home video footage and wax print fabric. Shown at TMU Image Factory (2024) and Woven Together (2025).",
        ],
      },
      {
        dates: "03.24",
        title: "Akuabata. Nkiruka",
        lines: [
          "Collage series built from family archival material, including letters from my grandfather. Shown at the +234 Art Fair, Ecobank Pan-African Centre, Lagos.",
        ],
      },
    ],
  },
  {
    id: "press",
    heading: "Press",
    column: "right",
    entries: [
      {
        dates: "02.21",
        title: "Elephant",
        href: "https://elephant.art/the-women-making-video-art-under-lockdown-15022021/",
        lines: ["“The Women Making Video Art Under Lockdown”"],
      },
      {
        dates: "03.25",
        title: "The Eyeopener",
        href: "https://theeyeopener.com/2025/03/embroidered-on-the-heart-textile-exhibit-opens-in-artspace-tmu/",
        lines: ["“Embroidered on the Heart: Textile Exhibit Opens in Artspace TMU”"],
      },
      {
        dates: "08.20",
        title: "Girls in Film",
        href: "https://www.girlsinfilm.net/videos/onyemaechi-who-knows-tomorrow",
        lines: ["“Onyemaechi (Who Knows Tomorrow)” — video feature"],
      },
    ],
  },
  {
    id: "skills",
    heading: "Skills",
    column: "left",
    list: [
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Adobe InDesign",
      "Figma",
      "Canva",
      "Video & Audio Editing",
      "Film Photography",
      "WordPress",
      "Mailchimp",
      "Social Media Management",
      "Writing / Editing",
    ],
  },
];
