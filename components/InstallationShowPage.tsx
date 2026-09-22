"use client";

import Image from "next/image";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import { DesktopStageViewContext } from "@/components/DesktopStageCanvas";

import {
  neighborInstallationShow,
  type InstallationGalleryImage,
  type InstallationShow,
} from "@/data/installation";
import {
  INSTALL_HANDOFF_EASE,
  INSTALL_HANDOFF_MS,
  INSTALL_META_GAP,
  INSTALL_META_SIZE,
  INSTALL_META_W,
  installationCardSize,
  installationTitleFontSize,
} from "@/lib/installation-layout";

import "./installation-show.css";
import "@/components/project/project-pane.css";

function InstallationMedia({
  image,
  className,
  sizes,
  fill,
  priority,
}: {
  image: InstallationGalleryImage;
  className?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
}) {
  if (image.placeholder || !image.src) {
    return (
      <div
        className={["installation-show__placeholder", className]
          .filter(Boolean)
          .join(" ")}
        style={
          fill
            ? undefined
            : {
                aspectRatio: `${image.width} / ${image.height}`,
              }
        }
        role="img"
        aria-label={image.alt}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized
    />
  );
}

export type HeroOriginRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type FlyRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Hero + meta fly as one locked composition (gap scales with them). */
type FlyHandoff = {
  /** Layout box — landing pixel size (smart-object source). */
  layout: FlyRect;
  start: FlyRect;
  end: FlyRect;
  heroColW: number;
  metaColW: number;
  gap: number;
  heroH: number;
  /** Landing title size (fit-to-width) — scales with the pair. */
  titleSize: number;
  metaSize: number;
  phase: "from" | "to";
};

type Props = {
  show: InstallationShow | null;
  /** Desktop: live inside the design-page shell center. Narrow: full overlay. */
  variant?: "desktop" | "narrow";
  /** Play enter animation (menu slide / hero rise / fade). */
  animateEnter?: boolean;
  /** Reverse handoff: hero flies back to carousel, content fades out. */
  closing?: boolean;
  /** Carousel card screen rect — used if gallery meta isn't measurable. */
  heroOrigin?: HeroOriginRect | null;
  /** Full landing pair (card + meta) captured on open — stable reverse target. */
  landingPairOrigin?: {
    card: HeroOriginRect;
    meta: HeroOriginRect;
  } | null;
  /** DOM id of the carousel / list card to FLIP into / out of. */
  closeTargetId?: string | null;
  onClose: () => void;
  onNavigateShow: (show: InstallationShow) => void;
  /** Fired after the open transition finishes (or immediately if skipped). */
  onEnterSettled?: () => void;
  /** Fired after the close transition finishes. */
  onCloseSettled?: () => void;
};

const ENTER_MS = INSTALL_HANDOFF_MS;
const EASE = INSTALL_HANDOFF_EASE;
/** Match InstallationGallery landing meta — smart-object source sizes. */
const LAND_META_W = INSTALL_META_W;
const LAND_META_GAP = INSTALL_META_GAP;
const LAND_META_SIZE = INSTALL_META_SIZE;

function rectOf(el: Element): FlyRect {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Pair laid out at landing pixel sizes, then one uniform scale morphs it.
 * Gap / type / meta width stay locked like a Photoshop smart object.
 */
function pairFlyStyle(
  layout: FlyRect,
  start: FlyRect,
  end: FlyRect,
  phase: "from" | "to",
): CSSProperties {
  const target = phase === "from" ? start : end;
  const s = target.width / Math.max(1, layout.width);
  const dx = target.left - layout.left;
  const dy = target.top - layout.top;
  return {
    position: "fixed",
    left: layout.left,
    top: layout.top,
    width: layout.width,
    height: layout.height,
    margin: 0,
    transformOrigin: "0 0",
    transform: `translate3d(${dx}px, ${dy}px, 0) scale(${s})`,
    transition:
      phase === "from" ? "none" : `transform ${ENTER_MS}ms ${EASE}`,
    zIndex: 10000,
    pointerEvents: "none",
    willChange: "transform",
    backfaceVisibility: "hidden",
  };
}

type LandPair = {
  card: FlyRect;
  metaW: number;
  gap: number;
  pairH: number;
};

/** Uniform scale of the landing pair — type stays at landing px forever. */
type SmartScale = {
  s: number;
  landHeroW: number;
  landHeroH: number;
  landMetaW: number;
  landGap: number;
  landTitle: number;
  landMetaSize: number;
};

/**
 * Installation case study. Desktop embeds in the three-zone shell (same middle
 * quadrant as design projects). Narrow is a full-viewport overlay.
 */
export function InstallationShowPage({
  show,
  variant = "narrow",
  animateEnter = true,
  closing = false,
  heroOrigin = null,
  landingPairOrigin = null,
  closeTargetId = null,
  onClose,
  onNavigateShow,
  onEnterSettled,
  onCloseSettled,
}: Props) {
  const [entering, setEntering] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fly, setFly] = useState<FlyHandoff | null>(null);
  const [smart, setSmart] = useState<SmartScale | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const pairSlotRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const flyGenRef = useRef(0);
  const smartRef = useRef<SmartScale | null>(null);
  const handoffLockRef = useRef(false);
  const visible = show != null;
  const caseStudy = show?.caseStudy;
  const isDesktop = variant === "desktop";
  smartRef.current = smart;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const stageView = useContext(DesktopStageViewContext);

  const resolveLandPair = useCallback((): LandPair | null => {
    let card: FlyRect | null = null;

    if (landingPairOrigin && landingPairOrigin.card.width > 2) {
      card = landingPairOrigin.card;
    }
    if (!card && heroOrigin && heroOrigin.width > 2) card = heroOrigin;
    if (!card && closeTargetId) {
      const el = document.getElementById(closeTargetId);
      if (el) {
        const c = rectOf(el);
        if (c.width > 2) card = c;
      }
    }
    if (!card && show) {
      /* Deep-link fallback — layout card expressed in screen px. */
      const sized = installationCardSize(show, 1);
      const u = stageView.layoutScreenUnit || 1;
      card = {
        left: 0,
        top: 0,
        width: sized.w * u,
        height: sized.h * u,
      };
    }
    if (!card) return null;

    return {
      card,
      metaW: LAND_META_W,
      gap: LAND_META_GAP,
      pairH: card.height,
    };
  }, [
    closeTargetId,
    heroOrigin,
    landingPairOrigin,
    show,
    stageView.layoutScreenUnit,
  ]);

  /**
   * Page header smart object uses LAYOUT px only (stage coords).
   * Never feed getBoundingClientRect widths in here — those are screen px
   * and break the group scale vs the fly portal.
   */
  const applySmartScale = useCallback(
    (titleLines: readonly string[]): SmartScale | null => {
      if (handoffLockRef.current && smartRef.current) {
        return smartRef.current;
      }
      if (!show) return null;
      const rail = railRef.current;
      if (!rail) return null;
      const cs = getComputedStyle(rail);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const railW = Math.max(1, rail.clientWidth - padL - padR);
      const sized = installationCardSize(show, 1);
      const pairW = sized.w + LAND_META_GAP + LAND_META_W;
      const s = railW / Math.max(1, pairW);
      const next: SmartScale = {
        s,
        landHeroW: sized.w,
        landHeroH: sized.h,
        landMetaW: LAND_META_W,
        landGap: LAND_META_GAP,
        landTitle: installationTitleFontSize(titleLines, LAND_META_W),
        landMetaSize: LAND_META_SIZE,
      };
      setSmart(next);
      return next;
    },
    [show],
  );

  const runPairFly = useCallback(
    (
      direction: "enter" | "leave",
      onDone: (() => void) | undefined,
    ) => {
      const gen = ++flyGenRef.current;
      const land = resolveLandPair();
      if (!land || !show) return false;

      let scale = smartRef.current;
      if (!scale) {
        scale = applySmartScale(show.titleLines);
        if (!scale) return false;
      }

      /*
       * Fly portal lives on document.body (outside stage scale). Build the
       * pair entirely in SCREEN px from the measured card + meta so image
       * and type share one transform — never mix layout 260/28 into screen.
       */
      const card = land.card;
      const meta = landingPairOrigin?.meta;
      const layoutCard = installationCardSize(show, 1);
      const screenPerLayout =
        meta && meta.width > 2
          ? meta.width / LAND_META_W
          : card.width / Math.max(1, layoutCard.w);

      const heroColW = card.width;
      const heroH = card.height;
      const gap =
        meta && meta.width > 2
          ? Math.max(0, meta.left - (card.left + card.width))
          : LAND_META_GAP * screenPerLayout;
      const metaColW =
        meta && meta.width > 2
          ? meta.width
          : LAND_META_W * screenPerLayout;
      const titleSize =
        installationTitleFontSize(show.titleLines, LAND_META_W) *
        screenPerLayout;
      const metaSize = LAND_META_SIZE * screenPerLayout;

      const layoutW = heroColW + gap + metaColW;
      const layoutH = heroH;
      const layout: FlyRect = {
        left: card.left,
        top: card.top,
        width: layoutW,
        height: layoutH,
      };
      const landRect: FlyRect = { ...layout };

      const measureEl = pairSlotRef.current ?? heroRef.current;
      if (!measureEl) return false;
      void measureEl.offsetWidth;
      const pageRect = rectOf(measureEl);
      if (pageRect.width < 2) return false;

      handoffLockRef.current = true;
      if (direction === "leave") setLeaving(true);
      if (direction === "enter") setEntering(true);

      const from = direction === "enter" ? landRect : pageRect;
      const to = direction === "enter" ? pageRect : landRect;

      /* Warm decode in parallel — never delay the FLIP (stale rects = ghosts). */
      if (direction === "enter") {
        const warm = new window.Image();
        warm.src = show.src;
        void warm.decode().catch(() => {});
      }

      setFly({
        layout,
        start: from,
        end: to,
        heroColW,
        metaColW,
        gap,
        heroH,
        titleSize,
        metaSize,
        phase: "from",
      });

      requestAnimationFrame(() => {
        if (flyGenRef.current !== gen) return;
        void document.body.offsetHeight;
        requestAnimationFrame(() => {
          if (flyGenRef.current !== gen) return;
          setFly((current) =>
            current ? { ...current, phase: "to" } : null,
          );
        });
      });

      window.setTimeout(() => {
        if (flyGenRef.current !== gen) return;
        handoffLockRef.current = false;
        /* Tear portal down before revealing the page header — otherwise the
           real (stage-scaled) pair paints at a different screen point than
           the portal for one frame and Safari shows a floating fragment. */
        setFly(null);
        if (direction === "enter") setEntering(false);
        if (direction === "leave") setLeaving(false);
        onDone?.();
      }, ENTER_MS + 32);

      return true;
    },
    [applySmartScale, landingPairOrigin, resolveLandPair, show],
  );

  /* Size header as smart object before paint / FLIP. */
  useLayoutEffect(() => {
    if (!show) {
      setSmart(null);
      return;
    }
    if (closing) return;
    const land = resolveLandPair();
    if (!land) return;
    applySmartScale(show.titleLines);

    const onResize = () => {
      if (handoffLockRef.current) return;
      const next = resolveLandPair();
      if (next) applySmartScale(show.titleLines);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [show?.id, show, resolveLandPair, applySmartScale, closing]);

  /* Open: landing pair scales up as one smart object into the page header. */
  useLayoutEffect(() => {
    if (!show || closing) return;
    scrollerRef.current?.scrollTo({ top: 0 });

    if (!animateEnter || reduceMotion) {
      setEntering(false);
      setFly(null);
      handoffLockRef.current = false;
      if (animateEnter && reduceMotion) onEnterSettled?.();
      return;
    }

    setLeaving(false);

    let retry = 0;
    const kick = () => {
      if (runPairFly("enter", onEnterSettled)) return;
      retry = window.setTimeout(() => {
        if (!runPairFly("enter", onEnterSettled)) {
          setEntering(false);
          handoffLockRef.current = false;
          onEnterSettled?.();
        }
      }, 48);
    };

    const raf = window.requestAnimationFrame(kick);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(retry);
      flyGenRef.current += 1;
      handoffLockRef.current = false;
    };
  }, [
    show?.id,
    animateEnter,
    reduceMotion,
    closing,
    show,
    runPairFly,
    onEnterSettled,
  ]);

  /* Close: smart object scales back down into the carousel card. */
  useLayoutEffect(() => {
    if (!show || !closing) return;

    if (reduceMotion) {
      setLeaving(false);
      setFly(null);
      handoffLockRef.current = false;
      onCloseSettled?.();
      return;
    }

    setEntering(false);
    scrollerRef.current?.scrollTo({ top: 0 });

    let retry = 0;
    const kick = () => {
      if (runPairFly("leave", onCloseSettled)) return;
      retry = window.setTimeout(() => {
        if (!runPairFly("leave", onCloseSettled)) onCloseSettled?.();
      }, 48);
    };

    kick();
    return () => {
      window.clearTimeout(retry);
      flyGenRef.current += 1;
      handoffLockRef.current = false;
    };
  }, [closing, show, reduceMotion, runPairFly, onCloseSettled]);

  useEffect(() => {
    if (!visible || isDesktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, onClose, isDesktop]);

  const goNeighbor = useCallback(
    (delta: number) => {
      if (!show) return;
      const next = neighborInstallationShow(show.id, delta);
      if (next) onNavigateShow(next);
    },
    [onNavigateShow, show],
  );

  if (!show) {
    if (isDesktop) return <div className="h-full w-full" aria-hidden />;
    return null;
  }

  const heroAr = `${show.width} / ${show.height}`;
  const landTitle = installationTitleFontSize(show.titleLines, LAND_META_W);
  const sized = installationCardSize(show, 1);
  const scale = smart ?? {
    s: 1,
    landHeroW: sized.w,
    landHeroH: sized.h,
    landMetaW: LAND_META_W,
    landGap: LAND_META_GAP,
    landTitle,
    landMetaSize: LAND_META_SIZE,
  };
  const landPairW = scale.landHeroW + scale.landGap + scale.landMetaW;
  const landPairH = scale.landHeroH;

  const metaInner = (
    <>
      <p className="installation-show__year">{show.year}</p>
      <p className="installation-show__kind">{show.kind}</p>
      <h1
        className="installation-show__title"
        style={{ color: show.titleColor }}
      >
        {show.titleLines.map((line) => (
          <span key={line} className="installation-show__title-line">
            {line}
          </span>
        ))}
      </h1>
      <p className="installation-show__venue">
        {show.venueLines.map((line) => (
          <span key={line} className="installation-show__venue-line">
            {line}
          </span>
        ))}
      </p>
    </>
  );

  const pairHeader = isDesktop ? (
    <div
      ref={pairSlotRef}
      className="installation-show__pair-slot"
      style={{
        width: landPairW * scale.s,
        height: landPairH * scale.s,
      }}
    >
      <div
        className="installation-show__pair-smart"
        style={{
          width: landPairW,
          height: landPairH,
          transform: `scale(${scale.s})`,
          gridTemplateColumns: `${scale.landHeroW}px ${scale.landMetaW}px`,
          columnGap: scale.landGap,
          ["--is-meta-size" as string]: `${scale.landMetaSize}px`,
          ["--is-title-size" as string]: `${scale.landTitle}px`,
        }}
      >
        <div
          ref={heroRef}
          className="installation-show__hero-media"
          style={
            {
              width: scale.landHeroW,
              height: scale.landHeroH,
              "--is-hero-ar": heroAr,
            } as CSSProperties
          }
        >
          <Image
            src={show.src}
            alt={show.alt}
            fill
            className="object-contain object-left-top"
            sizes="660px"
            priority
          />
        </div>
        <div
          className="installation-show__meta installation-show__fade"
          ref={metaRef}
        >
          {metaInner}
        </div>
      </div>
    </div>
  ) : (
    <div className="installation-show__top">
      <div
        ref={heroRef}
        className="installation-show__hero-media"
        style={{ "--is-hero-ar": heroAr } as CSSProperties}
      >
        <Image
          src={show.src}
          alt={show.alt}
          fill
          className="object-contain object-left-top"
          sizes="(max-width: 900px) 92vw, 720px"
          priority
        />
      </div>
      <div
        className="installation-show__meta installation-show__fade"
        ref={metaRef}
      >
        {metaInner}
      </div>
    </div>
  );

  const page = (
    <div
      className="installation-show__page"
      style={
        isDesktop
          ? undefined
          : ({
              ["--is-hero-w" as string]: `${scale.landHeroW * scale.s}px`,
              ["--is-meta-w" as string]: `${scale.landMetaW * scale.s}px`,
              ["--is-meta-gap" as string]: `${scale.landGap * scale.s}px`,
              ["--is-meta-size" as string]: `${scale.landMetaSize * scale.s}px`,
              ["--is-title-size" as string]: `${scale.landTitle * scale.s}px`,
            } satisfies CSSProperties)
      }
    >
      {pairHeader}

      {caseStudy ? (
        <>
          <div className="installation-show__body installation-show__fade">
            {caseStudy.paragraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>

          <div className="installation-show__gallery installation-show__fade">
            {caseStudy.gallery.map((img, i) => (
              <div
                key={img.src ?? `${show.id}-g-${i}`}
                className="installation-show__gallery-item"
              >
                <InstallationMedia
                  image={img}
                  fill
                  className="object-cover"
                  sizes={isDesktop ? "220px" : "(max-width: 900px) 92vw, 300px"}
                />
              </div>
            ))}
          </div>

          <div className="installation-show__collage installation-show__fade">
            <InstallationMedia
              image={caseStudy.largeCollage}
              className="installation-show__fill-img"
              sizes={isDesktop ? "660px" : "(max-width: 900px) 92vw, 920px"}
            />
          </div>

          <div className="installation-show__film installation-show__fade">
            <InstallationMedia
              image={caseStudy.filmStill}
              className="installation-show__fill-img"
              sizes={isDesktop ? "660px" : "(max-width: 900px) 92vw, 920px"}
            />
          </div>
          <p className="installation-show__film-caption installation-show__fade">
            {caseStudy.filmCaption}
          </p>
        </>
      ) : null}

      <footer className="installation-show__footer installation-show__fade">
        <button
          type="button"
          className="installation-show__nav"
          onClick={() => goNeighbor(-1)}
        >
          Back
        </button>
        <button
          type="button"
          className="installation-show__top-btn"
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
        <button
          type="button"
          className="installation-show__nav installation-show__nav--next"
          onClick={() => goNeighbor(1)}
        >
          Next
        </button>
      </footer>
    </div>
  );

  const handoffPortal =
    portalReady &&
    fly &&
    show &&
    createPortal(
      <div className="installation-handoff" aria-hidden>
        <div
          className="installation-handoff__pair"
          style={pairFlyStyle(fly.layout, fly.start, fly.end, fly.phase)}
        >
          <div
            className="installation-handoff__grid"
            style={{
              width: fly.layout.width,
              height: fly.layout.height,
              gridTemplateColumns: `${fly.heroColW}px ${fly.metaColW}px`,
              columnGap: fly.gap,
            }}
          >
            <div
              className="installation-handoff__hero"
              style={{ height: fly.heroH }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={show.src}
                alt=""
                className="installation-handoff__hero-img"
                draggable={false}
              />
            </div>
            <div className="installation-handoff__meta">
              <p
                className="installation-show__year"
                style={{ fontSize: fly.metaSize }}
              >
                {show.year}
              </p>
              <p
                className="installation-show__kind"
                style={{ fontSize: fly.metaSize }}
              >
                {show.kind}
              </p>
              <p
                className="installation-show__title"
                style={{
                  color: show.titleColor,
                  fontSize: fly.titleSize,
                }}
              >
                {show.titleLines.map((line) => (
                  <span key={line} className="installation-show__title-line">
                    {line}
                  </span>
                ))}
              </p>
              <p
                className="installation-show__venue"
                style={{ fontSize: fly.metaSize }}
              >
                {show.venueLines.map((line) => (
                  <span key={line} className="installation-show__venue-line">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );

  if (isDesktop) {
    return (
      <>
        {handoffPortal}
        <div
          className="project-pane installation-show installation-show--desktop"
          data-menu-state="hidden"
          data-visible={visible ? "" : undefined}
          data-entering={entering ? "" : undefined}
          data-leaving={leaving ? "" : undefined}
          aria-label={show.titleLines.join(" ")}
        >
          <div
            ref={scrollerRef}
            className="project-pane__scroll"
            data-project-scroll=""
          >
            <div className="installation-show__rail" ref={railRef}>
              {page}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {handoffPortal}
      <div
        className="installation-show installation-show--narrow"
        data-visible={visible ? "" : undefined}
        data-entering={entering ? "" : undefined}
        data-leaving={leaving ? "" : undefined}
        aria-hidden={!visible}
        role="dialog"
        aria-modal="true"
        aria-label={show.titleLines.join(" ")}
      >
        <div className="installation-show__shell">
          <header className="installation-show__header installation-show__fade">
            <button
              type="button"
              className="installation-show__menu-toggle"
              aria-label="Back to installation gallery"
              onClick={onClose}
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
          <div ref={scrollerRef} className="installation-show__scroll">
            {page}
          </div>
        </div>
      </div>
    </>
  );
}
