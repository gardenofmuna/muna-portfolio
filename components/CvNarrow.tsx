"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { CircularNavWheel } from "@/components/CircularNavWheel";
import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { SiteWordmark } from "@/components/SiteWordmark";
import {
  CV_EMAIL,
  CV_PDF,
  CV_SECTIONS,
  CV_SITE,
  type CvEntry,
  type CvSection,
} from "@/data/cv";
import { DESKTOP_LAYOUT_H, DESKTOP_LAYOUT_W } from "@/lib/desktop-stage";
import { NARROW_NZERIBE } from "@/lib/narrow-stage";
import {
  readStableLayoutSize,
  subscribeStableLayout,
} from "@/lib/stable-viewport";

import "./cv-narrow.css";

type Props = {
  visible: boolean;
  onNavigate: (label: string) => void;
  onOpenDesign: () => void;
};

/** Hamburger SVG viewBox — match project / installation chrome. */
const MENU_ASPECT = 107 / 74;
const MENU_HEIGHT_SCALE = 0.85;

/**
 * Mobile / tablet CV — every section in one column on a white page under
 * the shared chrome (wordmark + hamburger). No name heading; the wordmark
 * already says whose it is.
 */
export function CvNarrow({ visible, onNavigate, onOpenDesign }: Props) {
  const { u } = useNarrowArtboardMetrics();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewportH, setViewportH] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const headerScrolledRef = useRef(false);

  const scale = u || 1;
  const nzeribeH = NARROW_NZERIBE.h * scale;
  const menuH = nzeribeH * MENU_HEIGHT_SCALE;
  const menuW = menuH * MENU_ASPECT;
  const navScale = viewportH > 0 ? viewportH / DESKTOP_LAYOUT_H : 0;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const read = () => setViewportH(readStableLayoutSize().height);
    read();
    return subscribeStableLayout(read);
  }, []);

  const [wasVisible, setWasVisible] = useState(visible);
  if (wasVisible !== visible) {
    setWasVisible(visible);
    if (!visible) setMenuOpen(false);
  }

  useEffect(() => {
    if (!visible) return;
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTop = 0;
  }, [visible]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const header = headerRef.current;
    if (!scroller || !header || !visible) return;

    const sync = () => {
      const next = scroller.scrollTop > 8;
      if (next === headerScrolledRef.current) return;
      headerScrolledRef.current = next;
      header.toggleAttribute("data-scrolled", next);
    };

    sync();
    scroller.addEventListener("scroll", sync, { passive: true });
    return () => scroller.removeEventListener("scroll", sync);
  }, [visible]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const leaveCv = useCallback(
    (label: string) => {
      closeMenu();
      if (label === "cv + press") return;
      onNavigate(label);
      if (label === "design") onOpenDesign();
    },
    [closeMenu, onNavigate, onOpenDesign],
  );

  const fadeMs = reduceMotion ? 80 : 420;

  return (
    <div
      className="cv-narrow"
      data-visible={visible ? "" : undefined}
      data-menu-state={menuOpen ? "open" : "hidden"}
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      style={
        {
          "--cvn-nzeribe-h": `${nzeribeH}px`,
          "--cvn-menu-w": `${menuW}px`,
          "--cvn-menu-h": `${menuH}px`,
          transition: reduceMotion
            ? "none"
            : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        } as CSSProperties
      }
    >
      <header ref={headerRef} className="cv-narrow__header">
        <SiteWordmark
          href="/"
          placement="flow"
          onClick={(event) => {
            event.preventDefault();
            leaveCv("contact");
          }}
        />
        <button
          type="button"
          className="cv-narrow__menu-toggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 107 74" aria-hidden>
            <path
              fillRule="evenodd"
              fill="#000"
              d="M0.801,73.857 L0.801,62.195 L106.310,62.195 L106.310,73.857 L0.801,73.857 ZM0.801,31.098 L106.310,31.098 L106.310,42.759 L0.801,42.759 L0.801,31.098 ZM0.801,-0.000 L106.310,-0.000 L106.310,11.661 L0.801,11.661 L0.801,-0.000 Z"
            />
          </svg>
        </button>
      </header>

      <div
        ref={scrollerRef}
        className="cv-narrow__scroll"
        inert={menuOpen ? true : undefined}
      >
        <article className="cv-narrow__page" aria-label="CV">
          <p className="cv-narrow__contact">
            <a href={`mailto:${CV_EMAIL}`}>{CV_EMAIL}</a>
            <span aria-hidden> | </span>
            <a href={CV_SITE.href} target="_blank" rel="noreferrer">
              {CV_SITE.label}
            </a>
          </p>
          <a
            className="cv-narrow__download"
            href={CV_PDF.href}
            download={CV_PDF.filename}
          >
            download cv
          </a>
          {CV_SECTIONS.map((section) => (
            <CvNarrowSection key={section.id} section={section} />
          ))}
        </article>
        <footer className="cv-narrow__footer">
          <button
            type="button"
            className="cv-narrow__top"
            aria-label="Scroll to top"
            onClick={() =>
              scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="4 8 24 18"
              width="28"
              height="21"
              aria-hidden
            >
              <rect x="4" y="8" width="24" height="2" fill="currentColor" />
              <polygon
                points="16,14 6,24 7.4,25.4 16,16.8 24.6,25.4 26,24"
                fill="currentColor"
              />
            </svg>
          </button>
        </footer>
      </div>

      {menuOpen && navScale > 0 ? (
        <div
          className="cv-narrow__nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div
            className="cv-narrow__nav-stage"
            style={{
              width: DESKTOP_LAYOUT_W,
              height: DESKTOP_LAYOUT_H,
              transform: `scale(${navScale})`,
            }}
          >
            <CircularNavWheel
              layout="desktop"
              containment="stage"
              spinFeel="narrow"
              initialActiveLabel="cv + press"
              onLabelActivate={(label) => {
                if (label === "cv + press") {
                  closeMenu();
                  return;
                }
                if (
                  label === "design" ||
                  label === "about" ||
                  label === "installation" ||
                  label === "photos" ||
                  label === "contact"
                ) {
                  leaveCv(label);
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CvNarrowSection({ section }: { section: CvSection }) {
  return (
    <section className="cv-narrow__section">
      <h2 className="cv-narrow__heading">{section.heading}</h2>
      {section.entries ? (
        <ul className="cv-narrow__entries">
          {section.entries.map((entry) => (
            <CvNarrowRow key={`${entry.dates}-${entry.title}`} entry={entry} />
          ))}
        </ul>
      ) : null}
      {section.list ? (
        <ul className="cv-narrow__list">
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CvNarrowRow({ entry }: { entry: CvEntry }) {
  return (
    <li className="cv-narrow__entry">
      <p className="cv-narrow__dates">
        {entry.dates}
        {entry.dates && entry.datesItalic ? " " : null}
        {entry.datesItalic ? <em>{entry.datesItalic}</em> : null}
      </p>
      <div>
        <p className="cv-narrow__title">
          {entry.href ? (
            <a href={entry.href} target="_blank" rel="noreferrer">
              {entry.title}
            </a>
          ) : (
            entry.title
          )}
        </p>
        {entry.lines.map((line) => (
          <p key={line} className="cv-narrow__line">
            {line}
          </p>
        ))}
      </div>
    </li>
  );
}
