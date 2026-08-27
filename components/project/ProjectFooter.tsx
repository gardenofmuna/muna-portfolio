"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { useInPlaceDesignLink } from "@/components/project/DesignProjectNav";
import { useProjectScroll } from "@/components/project/ProjectContentPane";

type Props = {
  previousLabel?: string;
  previousHref?: string;
  nextLabel?: string;
  nextHref?: string;
};

function threeLetters(name: string) {
  return name.replace(/\s+/g, "").slice(0, 3);
}

/** Same sample as EGWU’s default previous name so Back / Next stay one size. */
const FOOTER_LABEL_FIT_LETTERS = threeLetters("STUDIO ORRY");

function FooterNav({
  align,
  word,
  projectName,
  fontSize,
  href,
}: {
  align: "start" | "end";
  word: string;
  projectName: string;
  fontSize?: number;
  href?: string;
}) {
  const className =
    align === "end"
      ? "project-footer__nav project-footer__nav--next"
      : "project-footer__nav";

  const inner = (
    <>
      <p
        className="project-footer__label"
        style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
      >
        {word}
      </p>
      {projectName ? (
        <p className="project-footer__project project-footer__project--placeholder">
          {projectName}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <FooterNavLink className={className} href={href}>
        {inner}
      </FooterNavLink>
    );
  }

  return <div className={className}>{inner}</div>;
}

function FooterNavLink({
  className,
  href,
  children,
}: {
  className: string;
  href: string;
  children: ReactNode;
}) {
  const linkProps = useInPlaceDesignLink(href);
  return (
    <Link className={className} {...linkProps}>
      {children}
    </Link>
  );
}

export function ProjectFooter({
  previousLabel = "STUDIO ORRY",
  previousHref,
  nextLabel = "DOC NOW 2025",
  nextHref,
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
  }, []);

  return (
    <footer className="project-footer">
      <span ref={threeRef} className="project-footer__measure" aria-hidden>
        {FOOTER_LABEL_FIT_LETTERS}
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
        href={previousHref}
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
        href={nextHref}
      />
    </footer>
  );
}
