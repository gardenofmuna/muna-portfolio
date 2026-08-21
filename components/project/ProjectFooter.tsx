"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { useProjectScroll } from "@/components/project/ProjectContentPane";

type Props = {
  previousLabel?: string;
  nextLabel?: string;
};

function threeLetters(name: string) {
  return name.replace(/\s+/g, "").slice(0, 3);
}

function FooterNav({
  align,
  word,
  projectName,
  fontSize,
}: {
  align: "start" | "end";
  word: string;
  projectName: string;
  fontSize?: number;
}) {
  return (
    <div
      className={
        align === "end"
          ? "project-footer__nav project-footer__nav--next"
          : "project-footer__nav"
      }
    >
      <p
        className="project-footer__label"
        style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
      >
        {word}
      </p>
      <p className="project-footer__project project-footer__project--placeholder">
        {projectName}
      </p>
    </div>
  );
}

export function ProjectFooter({
  previousLabel = "STUDIO ORRY",
  nextLabel = "DOC NOW 2025",
}: Props) {
  const scroll = useProjectScroll();
  const threeRef = useRef<HTMLSpanElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [sizePx, setSizePx] = useState<number>();

  useLayoutEffect(() => {
    const three = threeRef.current;
    const probe = probeRef.current;
    if (!three || !probe) return;

    const fit = () => {
      const targetW = three.offsetWidth;
      probe.style.fontSize = "40px";
      const at40 = probe.offsetWidth;
      if (targetW > 0 && at40 > 0) setSizePx((targetW / at40) * 40 * 0.76);
    };

    fit();
    void document.fonts.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(three);
    return () => ro.disconnect();
  }, [previousLabel]);

  return (
    <footer className="project-footer">
      <span ref={threeRef} className="project-footer__measure" aria-hidden>
        {threeLetters(previousLabel)}
      </span>
      <span
        ref={probeRef}
        className="project-footer__label project-footer__measure"
        aria-hidden
      >
        Back
      </span>
      <FooterNav
        align="start"
        word="Back"
        projectName={previousLabel}
        fontSize={sizePx}
      />
      <button
        type="button"
        className="project-footer__top"
        aria-label="Scroll to top"
        onClick={() => {
          if (scroll) {
            scroll.scrollToTop();
            return;
          }
          document
            .querySelector<HTMLElement>("[data-project-scroll]")
            ?.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="4 8 24 18"
          width="28"
          height="21"
          aria-hidden
          className="project-footer__top-icon"
        >
          <rect x="4" y="8" width="24" height="2" fill="currentColor" />
          <polygon
            points="16,14 6,24 7.4,25.4 16,16.8 24.6,25.4 26,24"
            fill="currentColor"
          />
        </svg>
      </button>
      <FooterNav
        align="end"
        word="Next"
        projectName={nextLabel}
        fontSize={sizePx}
      />
    </footer>
  );
}
