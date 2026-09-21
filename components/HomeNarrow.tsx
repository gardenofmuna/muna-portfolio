"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AboutBio } from "@/components/AboutBio";
import { AboutNarrow } from "@/components/AboutNarrow";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { DesignCluster } from "@/components/DesignCluster";
import { InstallationNarrow } from "@/components/InstallationNarrow";
import { InstallationShowPage } from "@/components/InstallationShowPage";
import { MobileFooterLinks } from "@/components/MobileFooterLinks";
import { NarrowWheelFit, useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
import { PhotosHoverCluster } from "@/components/PhotosHoverCluster";
import { CvPressHoverAccordion } from "@/components/CvPressHoverAccordion";
import { FilmHoverGif } from "@/components/FilmHoverGif";
import { SelectedWorksHoverGif } from "@/components/SelectedWorksHoverGif";
import { NarrowCenterPopup } from "@/components/NarrowCenterPopup";
import { SiteWordmark } from "@/components/SiteWordmark";
import { ProjectNarrowClient } from "@/components/project/ProjectNarrowClient";
import {
  getInstallationShowById,
  type InstallationShow,
} from "@/data/installation";
import {
  EGWU_RECORDS_SLUG,
  getProjectBySlug,
  type ProjectDefinition,
} from "@/data/projects";
import { NARROW_NAV_LABELS } from "@/lib/narrow-nav-ring";

import "./home-narrow.css";

const DESIGN_PROJECT_PATH = `/design/${EGWU_RECORDS_SLUG}`;
type NarrowLabel = (typeof NARROW_NAV_LABELS)[number];

type Props = {
  /** Direct visit to a project URL — same shell, already in project view. */
  initialProject?: ProjectDefinition;
  /** Deep link `/installation/[id]`. */
  initialInstallationId?: string;
};

/**
 * Artboard_2 (859×1623): centered wheel, wordmark, footer links always on,
 * about/contact bio in wheel hub — no page scroll.
 *
 * Project pages own the wordmark in the header so it can hide with the menu.
 */
export function HomeNarrow({
  initialProject,
  initialInstallationId,
}: Props) {
  const { vx } = useNarrowArtboardMetrics();
  const [activeLabel, setActiveLabel] = useState<NarrowLabel>(
    initialProject
      ? "design"
      : initialInstallationId
        ? "installation"
        : "contact",
  );
  const [hoverNavLabel, setHoverNavLabel] = useState<string | null>(null);
  const [wheelInteracting, setWheelInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  /** Remount landing wheel after leaving installation / about via hamburger. */
  const [wheelEpoch, setWheelEpoch] = useState(0);
  const [project, setProject] = useState<ProjectDefinition | null>(
    initialProject ?? null,
  );
  const [enteredFromLanding, setEnteredFromLanding] = useState(false);
  const [installationShow, setInstallationShow] =
    useState<InstallationShow | null>(() =>
      initialInstallationId
        ? (getInstallationShowById(initialInstallationId) ?? null)
        : null,
    );
  const [heroOrigin, setHeroOrigin] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [animateInstallEnter, setAnimateInstallEnter] = useState(false);
  const [installClosing, setInstallClosing] = useState(false);
  const projectRef = useRef(project);
  projectRef.current = project;
  const installationShowRef = useRef(installationShow);
  installationShowRef.current = installationShow;
  const installClosingRef = useRef(installClosing);
  installClosingRef.current = installClosing;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const openDesignProject = useCallback(() => {
    if (projectRef.current) return;
    const next = getProjectBySlug(EGWU_RECORDS_SLUG);
    if (!next) return;
    setEnteredFromLanding(true);
    setProject(next);
    document.title = `${next.title} | Muna | Portfolio`;
    if (window.location.pathname !== DESIGN_PROJECT_PATH) {
      window.history.pushState(
        { munaProject: EGWU_RECORDS_SLUG },
        "",
        DESIGN_PROJECT_PATH,
      );
    }
  }, []);

  const goToLanding = useCallback((label?: string) => {
    setProject(null);
    setInstallationShow(null);
    setHeroOrigin(null);
    setAnimateInstallEnter(false);
    setInstallClosing(false);
    setEnteredFromLanding(false);
    document.title = "Muna | Portfolio";
    if (label && (NARROW_NAV_LABELS as readonly string[]).includes(label)) {
      setActiveLabel(label as NarrowLabel);
      setWheelEpoch((n) => n + 1);
    }
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, []);

  const openInstallationShow = useCallback((show: InstallationShow) => {
    if (installClosingRef.current) return;
    const card = document.getElementById(`installation-narrow-${show.id}`);
    const rect = card?.getBoundingClientRect();
    if (rect && rect.width > 1 && rect.height > 1) {
      setHeroOrigin({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setHeroOrigin(null);
    }
    setInstallClosing(false);
    setAnimateInstallEnter(true);
    setInstallationShow(show);
    setActiveLabel("installation");
    document.title = `${show.titleLines.join(" ")} | Muna | Portfolio`;
    const path = `/installation/${show.id}`;
    if (window.location.pathname !== path) {
      window.history.pushState({ munaInstallation: show.id }, "", path);
    }
  }, []);

  const closeInstallationShow = useCallback(() => {
    const current = installationShowRef.current;
    if (!current || installClosingRef.current) return;

    setActiveLabel("installation");
    document.title = "Muna | Portfolio";
    if (window.location.pathname.startsWith("/installation/")) {
      window.history.pushState(null, "", "/");
    }

    if (reduceMotion) {
      setInstallationShow(null);
      setHeroOrigin(null);
      setAnimateInstallEnter(false);
      setInstallClosing(false);
      return;
    }

    setAnimateInstallEnter(false);
    setHeroOrigin(null);
    setInstallClosing(true);
  }, [reduceMotion]);

  const settleInstallClose = useCallback(() => {
    setInstallationShow(null);
    setInstallClosing(false);
    setHeroOrigin(null);
    setAnimateInstallEnter(false);
    setActiveLabel("installation");
  }, []);

  const onProjectChange = useCallback((next: ProjectDefinition) => {
    setEnteredFromLanding(false);
    setProject(next);
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname === "/") {
        setProject(null);
        setInstallationShow(null);
        setEnteredFromLanding(false);
        document.title = "Muna | Portfolio";
        return;
      }
      const installMatch = /^\/installation\/([^/]+)/.exec(
        window.location.pathname,
      );
      if (installMatch) {
        const next = getInstallationShowById(installMatch[1] ?? "");
        setProject(null);
        setInstallationShow(next ?? null);
        setActiveLabel("installation");
        if (next) {
          document.title = `${next.titleLines.join(" ")} | Muna | Portfolio`;
        }
        return;
      }
      const match = /^\/design\/([^/]+)/.exec(window.location.pathname);
      const next = match ? getProjectBySlug(match[1] ?? "") : undefined;
      setInstallationShow(null);
      setProject(next ?? null);
      setEnteredFromLanding(false);
      if (next) document.title = `${next.title} | Muna | Portfolio`;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /** While spinning, only the label at 12 o'clock previews — no stacked hovers. */
  const previewLabel =
    wheelInteracting && hoverNavLabel ? hoverNavLabel : activeLabel;
  /** Full-page about — settle or tap “about”. */
  const showAboutPage = !project && !installationShow && activeLabel === "about";
  const showAboutBio =
    !project &&
    !installationShow &&
    !showAboutPage &&
    (previewLabel === "about" || previewLabel === "contact");
  const showPhotos = !project && !installationShow && previewLabel === "photos";
  const showDesign = !project && !installationShow && previewLabel === "design";
  /** Full-page feed — settle on installation, or keep mounted while closing handoff runs. */
  const showInstallation =
    !project &&
    activeLabel === "installation" &&
    (!installationShow || installClosing);
  const showCvPress =
    !project && !installationShow && previewLabel === "cv + press";
  const showFilm = !project && !installationShow && previewLabel === "film";
  const showSelectedWorks =
    !project && !installationShow && previewLabel === "selected works";
  const fadeMs = wheelInteracting ? 120 : reduceMotion ? 80 : 520;
  const bioFadeStyle = {
    opacity: showAboutBio ? 1 : 0,
    transition: reduceMotion
      ? "none"
      : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    transform: showAboutBio ? "translateY(0)" : "translateY(12px)",
  } as const;

  const projectOpen = project != null;
  const mountLanding = !projectOpen || enteredFromLanding || !initialProject;
  const installationOpen = showInstallation && !projectOpen;
  const aboutOpen = showAboutPage && !projectOpen;
  const overlayOpen = installationOpen || aboutOpen;

  const leaveOverlay = useCallback((label: string) => {
    if ((NARROW_NAV_LABELS as readonly string[]).includes(label)) {
      setActiveLabel(label as NarrowLabel);
    }
    setWheelEpoch((n) => n + 1);
  }, []);

  return (
    <div className="narrow-app fixed inset-0 overflow-hidden bg-white">
      {projectOpen || overlayOpen ? null : (
      <div
        className="narrow-persist-wordmark"
        style={vx ? { left: `calc(${vx}px + var(--narrow-gutter))` } : undefined}
      >
        <SiteWordmark placement="flow" />
      </div>
      )}
      {mountLanding ? (
      <div
        className="narrow-landing"
        data-hidden={projectOpen || overlayOpen ? "" : undefined}
        aria-hidden={projectOpen || overlayOpen}
        inert={projectOpen || overlayOpen ? true : undefined}
      >
        {overlayOpen ? null : <MobileFooterLinks />}
        <NarrowWheelFit>
          <CircularNavWheel
            key={wheelEpoch}
            layout="narrow"
            initialActiveLabel={
              initialProject && wheelEpoch === 0 ? "design" : activeLabel
            }
            onActiveLabelChange={(label) => {
              if ((NARROW_NAV_LABELS as readonly string[]).includes(label)) {
                setActiveLabel(label as NarrowLabel);
              }
            }}
            onHoverLabelChange={setHoverNavLabel}
            onWheelInteractingChange={setWheelInteracting}
            onLabelActivate={(label) => {
              if (label === "design") {
                openDesignProject();
                return;
              }
              if (label === "about" || label === "installation") {
                setActiveLabel(label);
              }
            }}
          />
          <DesignCluster visible={showDesign} variant="narrow" />
          <FilmHoverGif visible={showFilm} layout="narrow" />
          <CvPressHoverAccordion visible={showCvPress} layout="narrow" />
          <SelectedWorksHoverGif visible={showSelectedWorks} layout="narrow" />
          <PhotosHoverCluster visible={showPhotos} variant="narrow" />
          <NarrowCenterPopup visible={showAboutBio} style={bioFadeStyle}>
            <AboutBio
              visible={showAboutBio}
              embedded
              narrowStage
              hubCentered
              whiteBodyText={previewLabel === "contact"}
            />
          </NarrowCenterPopup>
        </NarrowWheelFit>
      </div>
      ) : null}
      <AboutNarrow
        visible={aboutOpen}
        onNavigate={leaveOverlay}
        onOpenDesign={openDesignProject}
      />
      <InstallationNarrow
        visible={installationOpen}
        onNavigate={leaveOverlay}
        onOpenDesign={openDesignProject}
        onOpenShow={openInstallationShow}
      />
      <InstallationShowPage
        show={installationShow}
        variant="narrow"
        animateEnter={animateInstallEnter && !reduceMotion}
        closing={installClosing}
        heroOrigin={heroOrigin}
        closeTargetId={
          installationShow
            ? `installation-narrow-${installationShow.id}`
            : null
        }
        onEnterSettled={() => {
          setAnimateInstallEnter(false);
          setHeroOrigin(null);
        }}
        onCloseSettled={settleInstallClose}
        onClose={closeInstallationShow}
        onNavigateShow={(next) => {
          if (installClosing) return;
          setAnimateInstallEnter(false);
          setHeroOrigin(null);
          setInstallationShow(next);
          document.title = `${next.titleLines.join(" ")} | Muna | Portfolio`;
          const path = `/installation/${next.id}`;
          if (window.location.pathname !== path) {
            window.history.pushState({ munaInstallation: next.id }, "", path);
          }
        }}
      />
      {project ? (
        <div
          className={
            enteredFromLanding && !reduceMotion
              ? "narrow-project-fade"
              : undefined
          }
        >
          <ProjectNarrowClient
            project={project}
            onGoHome={goToLanding}
            onProjectChange={onProjectChange}
          />
        </div>
      ) : null}
    </div>
  );
}
