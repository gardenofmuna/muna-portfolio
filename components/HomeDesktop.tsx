"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { AboutBio, ABOUT_BIO_PIN_OFFSET_X } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { ContactTopLinks } from "@/components/ContactTopLinks";
import { CvPressHoverAccordion } from "@/components/CvPressHoverAccordion";
import { DesignLandingIndex } from "@/components/DesignLandingIndex";
import { DesktopSiteShell } from "@/components/DesktopSiteShell";
import { DesktopStageCanvas } from "@/components/DesktopStageCanvas";
import { FilmHoverGif } from "@/components/FilmHoverGif";
import { InstallationGallery } from "@/components/InstallationGallery";
import { InstallationShowPage } from "@/components/InstallationShowPage";
import { PhotosHoverCluster } from "@/components/PhotosHoverCluster";
import { SelectedWorksHoverGif } from "@/components/SelectedWorksHoverGif";
import { DesignProjectNavProvider } from "@/components/project/DesignProjectNav";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectIndexNav } from "@/components/project/ProjectIndexNav";
import {
  ProjectContentPane,
  type ProjectMenuState,
} from "@/components/project/ProjectContentPane";
import { ProjectCaseStudy } from "@/components/project/projects/ProjectCaseStudy";
import {
  DESKTOP_LAYOUT_BIO_LEFT,
  getDesktopStageMetrics,
} from "@/lib/desktop-stage";
import { installationCardSize } from "@/lib/installation-layout";
import {
  getInstallationShowById,
  type InstallationShow,
} from "@/data/installation";
import {
  getProjectBySlug,
  type ProjectDefinition,
} from "@/data/projects";

import "@/components/project/project-pane.css";

type Props = {
  /** Direct visit to a project URL — same shell, already in project view. */
  initialProject?: ProjectDefinition;
  /** Deep link `/installation/[id]`. */
  initialInstallationId?: string;
};

/**
 * Desktop landing — same 2875×1623 stage + three-quadrant shell as EGWÚ.
 * Menu uses stage containment (shared off-axis position). Hover/bio/contact
 * overlays are authored in layout coordinates and scale with the stage.
 *
 * Dialing “design” shows the project index in the middle; clicking a row
 * opens that case study in place (no route remount).
 */
export function HomeDesktop({
  initialProject,
  initialInstallationId,
}: Props) {
  const [activeLabel, setActiveLabel] = useState(
    initialProject ? "design" : initialInstallationId ? "installation" : "contact",
  );
  const [hoverNavLabel, setHoverNavLabel] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectDefinition | null>(
    initialProject ?? null,
  );
  /* Center pane trails project on close so the mark width tween isn’t
     starved by unmounting the case study on the same frame. */
  const [paneProject, setPaneProject] = useState<ProjectDefinition | null>(
    initialProject ?? null,
  );
  const [enteredFromLanding, setEnteredFromLanding] = useState(false);
  const [menuState, setMenuState] = useState<ProjectMenuState>("open");
  const [menuVeil, setMenuVeil] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [wheelInteracting, setWheelInteracting] = useState(false);
  /** Remount dial so signature “m” / exits can hard-reset angle + focus. */
  const [wheelEpoch, setWheelEpoch] = useState(0);
  const [wheelSpinRequest, setWheelSpinRequest] = useState<{
    label: string;
    id: number;
  } | null>(null);
  const [installationShow, setInstallationShow] =
    useState<InstallationShow | null>(() =>
      initialInstallationId
        ? (getInstallationShowById(initialInstallationId) ?? null)
        : null,
    );
  const [installFocusId, setInstallFocusId] = useState<string | null>(
    initialInstallationId ?? null,
  );
  const [heroOrigin, setHeroOrigin] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [landingPairOrigin, setLandingPairOrigin] = useState<{
    card: { left: number; top: number; width: number; height: number };
    meta: { left: number; top: number; width: number; height: number };
  } | null>(null);
  /** Keep carousel mounted briefly so neighbors fade while the hero FLIPs. */
  const [galleryHandoff, setGalleryHandoff] = useState(false);
  const [installClosing, setInstallClosing] = useState(false);
  const [animateInstallEnter, setAnimateInstallEnter] = useState(false);
  const m = getDesktopStageMetrics();
  const projectOpen = project != null;
  const projectRef = useRef(project);
  projectRef.current = project;
  const installationShowRef = useRef(installationShow);
  installationShowRef.current = installationShow;
  const installClosingRef = useRef(installClosing);
  installClosingRef.current = installClosing;
  /**
   * Opening a case study sets activeLabel to "design". Skip one settle so we
   * don't immediately bounce back to the design landing.
   */
  const skipDesignLandingExitRef = useRef(Boolean(initialProject));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const settleInstallEnter = useCallback(() => {
    if (installClosingRef.current) return;
    setGalleryHandoff(false);
    setAnimateInstallEnter(false);
    /* Keep landingPairOrigin — needed so close reverses to the same place. */
  }, []);

  const settleInstallClose = useCallback(() => {
    setInstallationShow(null);
    setInstallClosing(false);
    setGalleryHandoff(false);
    setHeroOrigin(null);
    setLandingPairOrigin(null);
    setAnimateInstallEnter(false);
    setActiveLabel("installation");
  }, []);

  const openInstallationShow = useCallback((show: InstallationShow) => {
    if (installClosingRef.current) return;
    const card = document.getElementById(`installation-card-${show.id}`);
    const gMeta = document.getElementById("installation-gallery-meta");
    const cardRect = card?.getBoundingClientRect();
    const metaRect = gMeta?.getBoundingClientRect();
    if (cardRect && cardRect.width > 1 && cardRect.height > 1) {
      const cardBox = {
        left: cardRect.left,
        top: cardRect.top,
        width: cardRect.width,
        height: cardRect.height,
      };
      setHeroOrigin(cardBox);
      if (metaRect && metaRect.width > 1) {
        setLandingPairOrigin({
          card: cardBox,
          meta: {
            left: metaRect.left,
            top: metaRect.top,
            width: metaRect.width,
            height: metaRect.height,
          },
        });
      } else {
        const unit =
          cardBox.width /
          Math.max(1, installationCardSize(show, 1).w);
        setLandingPairOrigin({
          card: cardBox,
          meta: {
            left: cardBox.left + cardBox.width + 28 * unit,
            top: cardBox.top,
            width: 260 * unit,
            height: cardBox.height,
          },
        });
      }
    } else {
      setHeroOrigin(null);
      setLandingPairOrigin(null);
    }
    setInstallClosing(false);
    setAnimateInstallEnter(true);
    setGalleryHandoff(true);
    setInstallationShow(show);
    setActiveLabel("installation");
    const path = `/installation/${show.id}`;
    if (window.location.pathname !== path) {
      window.history.pushState({ munaInstallation: show.id }, "", path);
    }
  }, []);

  const closeInstallationShow = useCallback(() => {
    const current = installationShowRef.current;
    if (!current || installClosingRef.current) return;

    setInstallFocusId(current.id);
    setActiveLabel("installation");
    if (window.location.pathname.startsWith("/installation/")) {
      window.history.pushState(null, "", "/");
    }

    if (reduceMotion) {
      setInstallationShow(null);
      setGalleryHandoff(false);
      setHeroOrigin(null);
      setLandingPairOrigin(null);
      setAnimateInstallEnter(false);
      setInstallClosing(false);
      return;
    }

    setAnimateInstallEnter(false);
    setGalleryHandoff(true);
    setInstallClosing(true);
  }, [reduceMotion]);

  const goToLanding = useCallback(
    (label = "contact", opts?: { preserveWheel?: boolean }) => {
      setActiveLabel(label);
      setHoverNavLabel(null);
      setWheelInteracting(false);
      setProject(null);
      setInstallationShow(null);
      setGalleryHandoff(false);
      setInstallClosing(false);
      setHeroOrigin(null);
      setLandingPairOrigin(null);
      setAnimateInstallEnter(false);
      setEnteredFromLanding(false);
      setMenuState("open");
      setMenuVeil(false);
      /* Dial already spun to the label — remounting flashes a “reload”. */
      if (!opts?.preserveWheel) {
        setWheelEpoch((n) => n + 1);
      }
      startTransition(() => {
        setPaneProject(null);
      });
      if (window.location.pathname !== "/") {
        window.history.pushState(null, "", "/");
      }
    },
    [],
  );

  /**
   * Exit a design case study into the design index — only the middle quadrant
   * swaps (no dial remount / crossfade “reload”).
   */
  const goToDesignLanding = useCallback(() => {
    setHoverNavLabel(null);
    setWheelInteracting(false);
    setActiveLabel("design");
    setMenuVeil(false);
    setMenuState("open");
    setEnteredFromLanding(false);
    setProject(null);
    setPaneProject(null);
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, []);

  const onProjectChange = useCallback((next: ProjectDefinition) => {
    /* Fade in when leaving the landing index for a case study. */
    setEnteredFromLanding(projectRef.current == null);
    setMenuState("open");
    setMenuVeil(false);
    skipDesignLandingExitRef.current = true;
    setActiveLabel("design");
    setProject(next);
    setPaneProject(next);
  }, []);

  const onNavLabelActivate = useCallback(
    (label: string) => {
      /* Click the centered “design” label while a case study is open → index. */
      if (label === "design" && projectRef.current) {
        goToDesignLanding();
      }
    },
    [goToDesignLanding],
  );

  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname === "/") {
        setActiveLabel("contact");
        setHoverNavLabel(null);
        setWheelInteracting(false);
        setProject(null);
        setInstallationShow(null);
        setGalleryHandoff(false);
        setHeroOrigin(null);
        setAnimateInstallEnter(false);
        setInstallClosing(false);
        setEnteredFromLanding(false);
        setMenuState("open");
        setMenuVeil(false);
        setWheelEpoch((n) => n + 1);
        startTransition(() => setPaneProject(null));
        return;
      }
      const installMatch = /^\/installation\/([^/]+)/.exec(
        window.location.pathname,
      );
      if (installMatch) {
        const next = getInstallationShowById(installMatch[1] ?? "");
        setProject(null);
        setPaneProject(null);
        setGalleryHandoff(false);
        setHeroOrigin(null);
        setAnimateInstallEnter(false);
        setInstallClosing(false);
        setInstallationShow(next ?? null);
        setActiveLabel("installation");
        return;
      }
      const match = /^\/design\/([^/]+)/.exec(window.location.pathname);
      const next = match ? getProjectBySlug(match[1] ?? "") : undefined;
      setInstallationShow(null);
      setProject(next ?? null);
      setPaneProject(next ?? null);
      setEnteredFromLanding(false);
      setMenuState("open");
      setMenuVeil(false);
      if (next) {
        skipDesignLandingExitRef.current = true;
        setActiveLabel("design");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* Previews follow the dial only while clicking/dragging — not mouse hover. */
  const previewLabel =
    wheelInteracting && hoverNavLabel ? hoverNavLabel : activeLabel;
  const isContact = previewLabel === "contact";
  const showAboutBio = previewLabel === "about" || isContact;
  const fadeMs = wheelInteracting
    ? 120
    : reduceMotion
      ? 80
      : 520;
  const crossfade = reduceMotion
    ? "none"
    : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;

  /**
   * While a case study is open, the dial can still spin. Settling on a
   * non-design label exits to that landing section without remounting the
   * wheel (it already sits on the chosen label). Returning to the design
   * index only happens when the user explicitly activates “design” (click the
   * centered label) or spins back onto design from another label — not when a
   * pointer-up leaves “design” still selected.
   */
  const showLandingPreviews = !projectOpen && installationShow == null;
  const installOpen = installationShow != null;
  const showInstallGallery =
    (!projectOpen && previewLabel === "installation" && !installOpen) ||
    galleryHandoff;
  const prevNavLabelRef = useRef(activeLabel);

  useEffect(() => {
    if (!projectOpen || wheelInteracting || installOpen) {
      if (!wheelInteracting) prevNavLabelRef.current = activeLabel;
      return;
    }

    const prev = prevNavLabelRef.current;
    prevNavLabelRef.current = activeLabel;

    if (activeLabel === "design") {
      if (skipDesignLandingExitRef.current) {
        skipDesignLandingExitRef.current = false;
        return;
      }
      /* Spun from another label onto design → design index. */
      if (prev !== "design") {
        goToDesignLanding();
      }
      return;
    }

    goToLanding(activeLabel, { preserveWheel: true });
  }, [
    activeLabel,
    goToDesignLanding,
    goToLanding,
    installOpen,
    projectOpen,
    wheelInteracting,
  ]);

  /** Clear signature column for bio; contact bar meets polaroid flush (no black gap). */
  const bioRightClearOfNzeribe = m.inset + m.nzeribeW + m.gapScaled;
  const contactBarRight = m.inset + m.frameW + 25;

  return (
    <DesignProjectNavProvider onProjectChange={onProjectChange}>
    <DesktopStageCanvas>
      <DesktopSiteShell
        layout="stage"
        showPolaroid={showLandingPreviews && previewLabel === "about"}
        menuState={
          projectOpen
            ? menuState
            : /* Open zone as soon as close starts so the dial is present with
               the gallery neighbors — not after the hero FLIP settles. */
              installOpen && !installClosing
              ? "hidden"
              : "open"
        }
        navLayerState={
          projectOpen
            ? undefined
            : installOpen && !installClosing
              ? "hidden"
              : "open"
        }
        /* Dial slide shares the hero FLIP duration/ease (in and out). */
        navHandoff={!projectOpen && installOpen}
        menuVeil={projectOpen && menuVeil}
        onOpenMenu={
          projectOpen
            ? () => {
                setMenuVeil(true);
                setMenuState("open");
              }
            : installOpen && !installClosing
              ? closeInstallationShow
              : undefined
        }
        onCloseMenu={
          projectOpen
            ? () => {
                setMenuVeil(false);
                setMenuState("hidden");
              }
            : undefined
        }
        onSignatureClick={
          projectOpen
            ? goToDesignLanding
            : installOpen
              ? closeInstallationShow
              : () => {
                  setHoverNavLabel(null);
                  setWheelInteracting(false);
                  setWheelSpinRequest((prev) => ({
                    label: "contact",
                    id: (prev?.id ?? 0) + 1,
                  }));
                }
        }
        signatureLabel={
          projectOpen
            ? "Back to design"
            : installOpen
              ? "Back to installations"
              : "Back to contact"
        }
        signatureCompact={
          projectOpen ||
          installOpen ||
          (!projectOpen && previewLabel === "installation")
        }
        nav={
          <CircularNavWheel
            key={wheelEpoch}
            layout="desktop"
            containment="stage"
            spinFeel="narrow"
            initialActiveLabel={
              initialProject && wheelEpoch === 0 ? "design" : activeLabel
            }
            onActiveLabelChange={setActiveLabel}
            onLabelActivate={onNavLabelActivate}
            onHoverLabelChange={setHoverNavLabel}
            onWheelInteractingChange={setWheelInteracting}
            spinRequest={wheelSpinRequest}
          />
        }
        center={
          installOpen ? (
            <div className="desktop-site-shell__center-slot">
              <InstallationShowPage
                show={installationShow}
                variant="desktop"
                animateEnter={animateInstallEnter && !reduceMotion}
                closing={installClosing}
                heroOrigin={heroOrigin}
                landingPairOrigin={landingPairOrigin}
                closeTargetId={
                  installationShow
                    ? `installation-card-${installationShow.id}`
                    : null
                }
                onEnterSettled={settleInstallEnter}
                onCloseSettled={settleInstallClose}
                onClose={closeInstallationShow}
                onNavigateShow={(next) => {
                  if (installClosing) return;
                  setAnimateInstallEnter(false);
                  setHeroOrigin(null);
                  setLandingPairOrigin(null);
                  setGalleryHandoff(false);
                  setInstallationShow(next);
                  const path = `/installation/${next.id}`;
                  if (window.location.pathname !== path) {
                    window.history.pushState(
                      { munaInstallation: next.id },
                      "",
                      path,
                    );
                  }
                }}
              />
            </div>
          ) : paneProject ? (
            <div
              className={
                enteredFromLanding && !reduceMotion
                  ? "desktop-site-shell__center-slot desktop-site-shell__quadrant-fill"
                  : "desktop-site-shell__center-slot"
              }
              style={
                projectOpen
                  ? undefined
                  : {
                      opacity: 0,
                      transition: crossfade,
                      pointerEvents: "none",
                      visibility: "hidden",
                    }
              }
              aria-hidden={!projectOpen}
            >
              <ProjectContentPane
                menuState={menuState}
                signatureCompact={projectOpen}
                onMenuStateChange={(next) => {
                  setMenuState(next);
                  if (next === "hidden") setMenuVeil(false);
                }}
              >
                <div className="project-pane__chrome">
                  <ProjectIndexNav
                    activeNumber={paneProject.number}
                    total={paneProject.indexTotal}
                  />
                </div>
                <ProjectHeader project={paneProject} menuState={menuState} />
                <ProjectCaseStudy project={paneProject} menuState={menuState} />
              </ProjectContentPane>
            </div>
          ) : (
            <div className="h-full w-full" aria-hidden />
          )
        }
        stageOverlays={
          <div
            className="pointer-events-none absolute inset-0 z-[50]"
            style={{
              opacity: showLandingPreviews || galleryHandoff ? 1 : 0,
              /* Project → design index: hard cut. Install handoff: none. Else fade. */
              transition:
                galleryHandoff ||
                (showLandingPreviews && previewLabel === "design")
                  ? "none"
                  : crossfade,
              /* Block hit-testing + paint while a case study owns the stage. */
              visibility:
                showLandingPreviews || galleryHandoff ? "visible" : "hidden",
            }}
            aria-hidden={!(showLandingPreviews || galleryHandoff)}
          >
            <DesignLandingIndex
              visible={showLandingPreviews && previewLabel === "design"}
            />
            <InstallationGallery
              visible={showInstallGallery}
              exiting={galleryHandoff && !installClosing}
              closing={installClosing}
              onOpenShow={openInstallationShow}
              focusShowId={installFocusId}
            />
            <PhotosHoverCluster
              visible={showLandingPreviews && previewLabel === "photos"}
              variant="desktop"
              stageLocked
            />
            <FilmHoverGif
              visible={showLandingPreviews && previewLabel === "film"}
              layout="desktop"
              stageLocked
            />
            <CvPressHoverAccordion
              visible={showLandingPreviews && previewLabel === "cv + press"}
              layout="desktop"
              stageLocked
            />
            <SelectedWorksHoverGif
              visible={showLandingPreviews && previewLabel === "select works"}
              layout="desktop"
              stageLocked
            />
            <ContactTopLinks
              visible={showLandingPreviews && isContact}
              stageLocked
              top={`${m.inset}px`}
              left={`${DESKTOP_LAYOUT_BIO_LEFT + ABOUT_BIO_PIN_OFFSET_X}px`}
              right={`${contactBarRight}px`}
            />
            <div
              aria-hidden={!(showLandingPreviews && showAboutBio)}
              className="pointer-events-none absolute z-[30] flex flex-row items-end"
              style={{
                left: DESKTOP_LAYOUT_BIO_LEFT,
                right: bioRightClearOfNzeribe,
                bottom: m.inset,
                opacity: showLandingPreviews && showAboutBio ? 1 : 0,
                transition: crossfade,
              }}
            >
              <AboutBio
                visible={showLandingPreviews && showAboutBio}
                embedded
                stageLocked
                whiteBodyText={isContact}
              />
            </div>
          </div>
        }
      />
    </DesktopStageCanvas>
    </DesignProjectNavProvider>
  );
}
