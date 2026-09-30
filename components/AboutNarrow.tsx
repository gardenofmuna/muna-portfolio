"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { ContactForm } from "@/components/ContactForm";
import type { CvTone } from "@/components/CvPane";
import { MobileFooterLinks } from "@/components/MobileFooterLinks";
import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { SiteWordmark } from "@/components/SiteWordmark";
import { DESKTOP_LAYOUT_H, DESKTOP_LAYOUT_W } from "@/lib/desktop-stage";
import { NARROW_NZERIBE } from "@/lib/narrow-stage";
import {
  readStableLayoutSize,
  subscribeStableLayout,
} from "@/lib/stable-viewport";

import "./about-narrow.css";

export type NarrowInfoPage = "about" | "contact";

type Props = {
  page: NarrowInfoPage;
  visible: boolean;
  /** Contact page ticket stock. */
  tone?: CvTone;
  onNavigate: (label: string) => void;
  onOpenDesign: () => void;
};

/** Hamburger SVG viewBox — match project / installation chrome. */
const MENU_ASPECT = 107 / 74;
const MENU_HEIGHT_SCALE = 0.85;

/** Bio size when the screen has room (px), and the floor when it doesn't. */
const BIO_MIN_PX = 11;
const ARM_MS = 450;
const bioPreferredPx = (vw: number) => Math.min(22, Math.max(17, vw * 0.046));

/**
 * Mobile / tablet about and contact pages under the shared chrome. Neither
 * scrolls: the body is sized to fit between the header and the footer links.
 */
export function AboutNarrow({
  page,
  visible,
  tone = "pink",
  onNavigate,
  onOpenDesign,
}: Props) {
  const { u } = useNarrowArtboardMetrics();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);

  const scale = u || 1;
  const nzeribeH = NARROW_NZERIBE.h * scale;
  const menuH = nzeribeH * MENU_HEIGHT_SCALE;
  const menuW = menuH * MENU_ASPECT;
  const navScale =
    viewport.height > 0 ? viewport.height / DESKTOP_LAYOUT_H : 0;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const read = () => setViewport(readStableLayoutSize());
    read();
    return subscribeStableLayout(read);
  }, []);

  /* The tap that opens the page lands on it too (a field would take focus
     and raise the keyboard), so it ignores touches for a beat. */
  const [armed, setArmed] = useState(visible);
  const [wasVisible, setWasVisible] = useState(visible);
  if (wasVisible !== visible) {
    setWasVisible(visible);
    setArmed(false);
    if (!visible) setMenuOpen(false);
  }
  useEffect(() => {
    if (!visible || armed) return;
    const t = window.setTimeout(() => setArmed(true), ARM_MS);
    return () => window.clearTimeout(t);
  }, [armed, visible]);

  /* About: largest bio size (up to the usual one) whose polaroid + text
     still fit the body. Keyed to the stable viewport so the keyboard or
     browser bars never reflow it. */
  useLayoutEffect(() => {
    if (page !== "about") return;
    const body = bodyRef.current;
    const fit = fitRef.current;
    if (!body || !fit || viewport.width <= 0) return;

    const run = () => {
      const room = body.clientHeight;
      if (room <= 0) return;
      let lo = BIO_MIN_PX;
      let hi = bioPreferredPx(viewport.width);
      fit.style.fontSize = `${hi}px`;
      if (fit.offsetHeight <= room) return;
      for (let i = 0; i < 9; i++) {
        const mid = (lo + hi) / 2;
        fit.style.fontSize = `${mid}px`;
        if (fit.offsetHeight <= room) lo = mid;
        else hi = mid;
      }
      fit.style.fontSize = `${lo}px`;
    };

    run();
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) run();
    });
    return () => {
      live = false;
    };
  }, [page, viewport]);

  /* Contact: the footer links span the ticket's width. */
  useLayoutEffect(() => {
    if (page !== "contact") return;
    const root = rootRef.current;
    const ticket = root?.querySelector<HTMLElement>(".contact-form__ticket");
    if (!root || !ticket) return;
    const ro = new ResizeObserver(() => {
      root.style.setProperty("--ab-ticket-w", `${ticket.offsetWidth}px`);
    });
    ro.observe(ticket);
    return () => ro.disconnect();
  }, [page]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const leavePage = useCallback(
    (label: string) => {
      closeMenu();
      if (label === page) return;
      onNavigate(label);
      if (label === "design") onOpenDesign();
    },
    [closeMenu, onNavigate, onOpenDesign, page],
  );

  const fadeMs = reduceMotion ? 80 : 420;

  return (
    <div
      ref={rootRef}
      className="about-narrow"
      data-page={page}
      data-visible={visible ? "" : undefined}
      data-armed={armed ? "" : undefined}
      data-menu-state={menuOpen ? "open" : "hidden"}
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      style={
        {
          "--ab-nzeribe-h": `${nzeribeH}px`,
          "--ab-menu-w": `${menuW}px`,
          "--ab-menu-h": `${menuH}px`,
          ...(viewport.height > 0
            ? { height: `${viewport.height}px`, bottom: "auto" }
            : null),
          transition: reduceMotion
            ? "none"
            : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        } as CSSProperties
      }
    >
      <header className="about-narrow__header">
        <SiteWordmark
          href="/"
          placement="flow"
          onClick={(event) => {
            event.preventDefault();
            leavePage("home");
          }}
        />
        <button
          type="button"
          className="about-narrow__menu-toggle"
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

      <main
        ref={bodyRef}
        className="about-narrow__body"
        inert={menuOpen ? true : undefined}
      >
        {page === "about" ? (
          <div ref={fitRef} className="about-narrow__fit">
            <div className="about-narrow__polaroid">
              <Image
                src="/muna-polaroid.webp"
                alt="Muna"
                fill
                className="about-narrow__polaroid-image"
                sizes="(max-width: 700px) 52vw, 220px"
                priority
              />
            </div>
            <AboutBio visible={visible} flow />
          </div>
        ) : (
          <ContactForm layout="page" visible={visible} tone={tone} />
        )}
      </main>

      <footer
        className="about-narrow__footer"
        inert={menuOpen ? true : undefined}
      >
        <MobileFooterLinks placement="flow" />
      </footer>

      {menuOpen && navScale > 0 ? (
        <div
          className="about-narrow__nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div
            className="about-narrow__nav-stage"
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
              initialActiveLabel={page}
              onLabelActivate={(label) => {
                if (
                  label === "about" ||
                  label === "contact" ||
                  label === "design" ||
                  label === "installation" ||
                  label === "photos" ||
                  label === "cv + press"
                ) {
                  leavePage(label);
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
