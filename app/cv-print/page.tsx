import type { Metadata } from "next";

import { CvContent } from "@/components/CvPane";

import "@/components/project/project-pane.css";
import "@/components/cv-pane.css";
import "@/components/cv-print.css";

export const metadata: Metadata = {
  title: "Munachiso Nzeribe — CV",
  robots: { index: false, follow: false },
};

/** White, printable CV — the source of `public/Munachiso-Nzeribe-CV.pdf`. */
export default function CvPrintPage() {
  return (
    <main className="cv-print">
      <article className="cv-pane cv-pane--print" aria-label="CV">
        <CvContent />
      </article>
    </main>
  );
}
