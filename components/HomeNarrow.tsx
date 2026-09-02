"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { DesignCluster } from "@/components/DesignCluster";
import { InstallationLottie } from "@/components/InstallationLottie";
import { MobileFooterLinks } from "@/components/MobileFooterLinks";
import { NarrowArtboard, useNarrowArtboardMetrics } from "@/components/NarrowArtboard";
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
import {
  NARROW_H,
  NARROW_W,
  NARROW_WHEEL_CENTER,
} from "@/lib/narrow-stage";

import "./home-narrow.css";

const DESIGN_PROJECT_PATH = `/design/${EGWU_RECORDS_SLUG}`;

type Props = {
  /** Direct visit to a project URL — same shell, already in project view. */
  initialProject?: ProjectDefinition;
};

/**
 * Artboard_2 (859×1623): centered wheel, wordmark, footer links always on,
 * about/contact bio in wheel hub — no page scroll.
 *
 * Tapping “design” keeps the wordmark mounted and fills the rest in place
 * (no route remount, no cream/yellow flash).
 */
export function HomeNarrow({ initialProject }: Props) {
  const { u } = useNarrowArtboardMetrics();
  const [activeLabel, setActiveLabel] = useState(
    initialProject ? "design" : "contact",
  );
  const [hoverNavLabel, setHoverNavLabel] = useState<string | null>(null);
  const [wheelInteracting, setWheelInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [viewportW, setViewportW] = useState(0);
  const [project, setProject] = useState<ProjectDefinition | null>(
    initialProject ?? null,
  );
  const [enteredFromLanding, setEnteredFromLanding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const read = () => setViewportW(window.innerWidth);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
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

  const goToLanding = useCallback(() => {
    setProject(null);
    setEnteredFromLanding(false);
    setMenuOpen(false);
    document.title = "Muna | Portfolio";
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
        setEnteredFromLanding(false);
        setMenuOpen(false);
        document.title = "Muna | Portfolio";
        return;
      }
      const match = /^\/design\/([^/]+)/.exec(window.location.pathname);
      const next = match ? getProjectBySlug(match[1] ?? "") : undefined;
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
  const showAboutBio =
    !project && (previewLabel === "about" || previewLabel === "contact");
  const showPhotos = !project && previewLabel === "photos";
  const showDesign = !project && previewLabel === "design";
  const showInstallation = !project && previewLabel === "installation";
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
  const landingWheelScale = useMemo(() => {
    if (!viewportW || !u) return 1;
    const currentGroupWidth = NARROW_W * u;
    if (currentGroupWidth <= 0) return 1;
    const isTabletScaleUp = currentGroupWidth < viewportW - 16;
    const sideInset = isTabletScaleUp ? 28 : 16;
    const scale = (viewportW - sideInset) / currentGroupWidth;
    return isTabletScaleUp ? scale * 0.88 : scale;
  }, [u, viewportW]);

  const projectOpen = project != null;
  const mountLanding = !projectOpen || enteredFromLanding || !initialProject;

  return (
    <div className="narrow-app fixed inset-0 overflow-hidden bg-white">
      <div
        className="narrow-persist-wordmark"
        data-hidden={menuOpen ? "" : undefined}
      >
        <SiteWordmark
          placement="flow"
          href={projectOpen ? "/" : undefined}
          onClick={
            projectOpen
              ? (event) => {
                  event.preventDefault();
                  goToLanding();
                }
              : undefined
          }
        />
      </div>
      {mountLanding ? (
      <div
        className="narrow-landing"
        data-hidden={projectOpen ? "" : undefined}
        aria-hidden={projectOpen}
        inert={projectOpen ? true : undefined}
      >
        <NarrowArtboard>
          <MobileFooterLinks />
          <div
            className="absolute left-0 top-0"
            style={{
              width: NARROW_W,
              height: NARROW_H,
              transform: `scale(${landingWheelScale})`,
              transformOrigin: `${NARROW_WHEEL_CENTER.x}px ${NARROW_WHEEL_CENTER.y}px`,
            }}
          >
            <CircularNavWheel
              layout="narrow"
              initialActiveLabel={initialProject ? "design" : "contact"}
              onActiveLabelChange={setActiveLabel}
              onHoverLabelChange={setHoverNavLabel}
              onWheelInteractingChange={setWheelInteracting}
              onLabelActivate={(label) => {
                if (label === "design") {
                  openDesignProject();
                }
              }}
            />
            <DesignCluster visible={showDesign} variant="narrow" />
            <InstallationLottie visible={showInstallation} layout="narrow" />
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
          </div>
        </NarrowArtboard>
      </div>
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
            hideWordmark
            onGoHome={goToLanding}
            onMenuOpenChange={setMenuOpen}
            onProjectChange={onProjectChange}
          />
        </div>
      ) : null}
    </div>
  );
}
