"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { SiteWordmark } from "@/components/SiteWordmark";
import { DESKTOP_LAYOUT_H, DESKTOP_LAYOUT_W } from "@/lib/desktop-stage";
import { NARROW_NZERIBE } from "@/lib/narrow-stage";
import {
  readStableLayoutSize,
  subscribeStableLayout,
} from "@/lib/stable-viewport";

import "./about-narrow.css";

type Props = {
  visible: boolean;
  onNavigate: (label: string) => void;
  onOpenDesign: () => void;
};

/** Hamburger SVG viewBox — match project / installation chrome. */
const MENU_ASPECT = 107 / 74;
const MENU_HEIGHT_SCALE = 0.85;

/**
 * Mobile / tablet about page — polaroid + flowing bio under shared chrome.
 */
export function AboutNarrow({ visible, onNavigate, onOpenDesign }: Props) {
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

  const leaveAbout = useCallback(
    (label: string) => {
      closeMenu();
      if (label === "about") return;
      onNavigate(label);
      if (label === "design") onOpenDesign();
    },
    [closeMenu, onNavigate, onOpenDesign],
  );

  const fadeMs = reduceMotion ? 80 : 420;

  return (
    <div
      className="about-narrow"
      data-visible={visible ? "" : undefined}
      data-menu-state={menuOpen ? "open" : "hidden"}
      aria-hidden={!visible}
      inert={!visible ? true : undefined}
      style={
        {
          "--ab-nzeribe-h": `${nzeribeH}px`,
          "--ab-menu-w": `${menuW}px`,
          "--ab-menu-h": `${menuH}px`,
          transition: reduceMotion
            ? "none"
            : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        } as CSSProperties
      }
    >
      <header ref={headerRef} className="about-narrow__header">
        <SiteWordmark
          href="/"
          placement="flow"
          onClick={(event) => {
            event.preventDefault();
            leaveAbout("contact");
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

      <div
        ref={scrollerRef}
        className="about-narrow__scroll"
        inert={menuOpen ? true : undefined}
      >
        <div className="about-narrow__page">
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
      </div>

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
              initialActiveLabel="about"
              onLabelActivate={(label) => {
                if (label === "about") {
                  closeMenu();
                  return;
                }
                if (
                  label === "design" ||
                  label === "installation" ||
                  label === "photos"
                ) {
                  leaveAbout(label);
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
