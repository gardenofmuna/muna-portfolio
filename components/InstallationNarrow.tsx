"use client";

import Image from "next/image";
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
import { INSTALLATION_SHOWS } from "@/data/installation";
import { DESKTOP_LAYOUT_H, DESKTOP_LAYOUT_W } from "@/lib/desktop-stage";
import { NARROW_NZERIBE } from "@/lib/narrow-stage";
import {
  readStableLayoutSize,
  subscribeStableLayout,
} from "@/lib/stable-viewport";

import "./installation-narrow.css";

type Props = {
  visible: boolean;
  onNavigate: (label: string) => void;
  onOpenDesign: () => void;
  onOpenShow?: (show: (typeof INSTALLATION_SHOWS)[number]) => void;
};

/** Hamburger SVG viewBox — match project-narrow chrome. */
const MENU_ASPECT = 107 / 74;
const MENU_HEIGHT_SCALE = 0.85;

/**
 * Mobile / tablet installation landing — vertical scroll of every show
 * (image + right-aligned caption), padded to the wordmark / menu gutter.
 */
export function InstallationNarrow({
  visible,
  onNavigate,
  onOpenDesign,
  onOpenShow,
}: Props) {
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
    const read = () => {
      setViewportH(readStableLayoutSize().height);
    };
    read();
    return subscribeStableLayout(read);
  }, []);

  useEffect(() => {
    if (!visible) {
      setMenuOpen(false);
      return;
    }
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

  const leaveInstallation = useCallback(
    (label: string) => {
      closeMenu();
      if (label === "installation") return;
      onNavigate(label);
      if (label === "design") onOpenDesign();
    },
    [closeMenu, onNavigate, onOpenDesign],
  );

  const fadeMs = reduceMotion ? 80 : 420;

  return (
    <div
      className="installation-narrow"
      data-visible={visible ? "" : undefined}
      data-menu-state={menuOpen ? "open" : "hidden"}
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      style={
        {
          "--in-nzeribe-h": `${nzeribeH}px`,
          "--in-menu-w": `${menuW}px`,
          "--in-menu-h": `${menuH}px`,
          transition: reduceMotion
            ? "none"
            : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        } as CSSProperties
      }
    >
      <header ref={headerRef} className="installation-narrow__header">
        <SiteWordmark
          href="/"
          placement="flow"
          onClick={(event) => {
            event.preventDefault();
            leaveInstallation("contact");
          }}
        />
        <button
          type="button"
          className="installation-narrow__menu-toggle"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 107 74"
            aria-hidden
          >
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
        className="installation-narrow__scroll"
        inert={menuOpen ? true : undefined}
      >
        <div className="installation-narrow__page">
          {INSTALLATION_SHOWS.map((show) => (
            <article key={show.id} className="installation-narrow__show">
              <button
                type="button"
                id={`installation-narrow-${show.id}`}
                className="installation-narrow__open"
                onClick={() => onOpenShow?.(show)}
                aria-label={`Open ${show.titleLines.join(" ")}`}
              >
                <div className="installation-narrow__frame">
                  <Image
                    src={show.src}
                    alt={show.alt}
                    width={show.width}
                    height={show.height}
                    className="installation-narrow__image"
                    sizes="(max-width: 700px) calc(100vw - 40px), calc(100vw - 104px)"
                  />
                </div>
                <div className="installation-narrow__meta">
                  <p className="installation-narrow__year">{show.year}</p>
                  <p className="installation-narrow__kind">{show.kind}</p>
                  <p
                    className="installation-narrow__title"
                    style={{ color: show.titleColor }}
                  >
                    {show.titleLines.map((line) => (
                      <span
                        key={line}
                        className="installation-narrow__title-line"
                      >
                        {line}
                      </span>
                    ))}
                  </p>
                  <p className="installation-narrow__venue">
                    {show.venueLines.map((line) => (
                      <span
                        key={line}
                        className="installation-narrow__venue-line"
                      >
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              </button>
            </article>
          ))}
        </div>
      </div>

      {menuOpen && navScale > 0 ? (
        <div
          className="installation-narrow__nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div
            className="installation-narrow__nav-stage"
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
              initialActiveLabel="installation"
              onLabelActivate={(label) => {
                if (label === "installation") {
                  closeMenu();
                  return;
                }
                if (label === "design" || label === "about") {
                  leaveInstallation(label);
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
