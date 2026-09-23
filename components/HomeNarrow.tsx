"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AboutBio } from "@/components/AboutBio";
import { AboutNarrow } from "@/components/AboutNarrow";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { DesignCluster } from "@/components/DesignCluster";
import { InstallationNarrow } from "@/components/InstallationNarrow";
import { InstallationShowPage } from "@/components/InstallationShowPage";
import {
  getInstallationShowById,
  type InstallationShow,
} from "@/data/installation";
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
  const [installationShow, setInstallationShow] =
    useState<InstallationShow | null>(() =>
      initialInstallationId
        ? (getInstallationShowById(initialInstallationId) ?? null)
        : null,
    );
  const [enteredFromLanding, setEnteredFromLanding] = useState(false);
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* Deep link opens the case study immediately — no fly animation on mobile. */
  useEffect(() => {
    if (!initialInstallationId) return;
    const show = getInstallationShowById(initialInstallationId);
    if (!show) return;
    setInstallationShow(show);
    setActiveLabel("installation");
    document.title = `${show.titleLines.join(" ")} | Muna | Portfolio`;
  }, [initialInstallationId]);

  const openDesignProject = useCallback(() => {
    if (projectRef.current) return;
    const next = getProjectBySlug(EGWU_RECORDS_SLUG);
    if (!next) return;
    setEnteredFromLanding(true);
    setInstallationShow(null);
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

  const openInstallationShow = useCallback((show: InstallationShow) => {
    setInstallationShow(show);
    setActiveLabel("installation");
    document.title = `${show.titleLines.join(" ")} | Muna | Portfolio`;
    const path = `/installation/${show.id}`;
    if (window.location.pathname !== path) {
      window.history.pushState({ munaInstallation: show.id }, "", path);
    }
  }, []);

  const closeInstallationShow = useCallback(() => {
    setInstallationShow(null);
    setActiveLabel("installation");
    document.title = "Muna | Portfolio";
    if (window.location.pathname.startsWith("/installation/")) {
      window.history.pushState(null, "", "/");
    }
  }, []);

  const goToLanding = useCallback((label?: string) => {
    setProject(null);
    setInstallationShow(null);
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
        setProject(null);
        setActiveLabel("installation");
        const show = getInstallationShowById(installMatch[1] ?? "");
        setInstallationShow(show ?? null);
        document.title = show
          ? `${show.titleLines.join(" ")} | Muna | Portfolio`
          : "Muna | Portfolio";
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
  const showAboutPage = !project && activeLabel === "about";
  const showAboutBio =
    !project &&
    !showAboutPage &&
    (previewLabel === "about" || previewLabel === "contact");
  const showPhotos = !project && previewLabel === "photos";
  const showDesign = !project && previewLabel === "design";
  /** Installation landing feed — hidden while a case study is open. */
  const showInstallation =
    !project && activeLabel === "installation" && !installationShow;
  const showCvPress = !project && previewLabel === "cv + press";
  const showFilm = !project && previewLabel === "film";
  const showSelectedWorks = !project && previewLabel === "selected works";
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
  const caseStudyOpen = installationShow != null && !projectOpen;
  const overlayOpen = installationOpen || aboutOpen || caseStudyOpen;

  const leaveOverlay = useCallback((label: string) => {
    setInstallationShow(null);
    if ((NARROW_NAV_LABELS as readonly string[]).includes(label)) {
      setActiveLabel(label as NarrowLabel);
    }
    setWheelEpoch((n) => n + 1);
    document.title = "Muna | Portfolio";
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
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
      {caseStudyOpen && installationShow ? (
        <InstallationShowPage
          show={installationShow}
          variant="narrow"
          animateEnter={false}
          onClose={closeInstallationShow}
          onNavigateShow={openInstallationShow}
          onNavigateLanding={(label) => {
            if (label === "design") {
              openDesignProject();
              return;
            }
            leaveOverlay(label);
          }}
        />
      ) : null}
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
