"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { ContactTopLinks } from "@/components/ContactTopLinks";
import { CvPressHoverAccordion } from "@/components/CvPressHoverAccordion";
import { DesignCluster } from "@/components/DesignCluster";
import { DesktopSiteShell } from "@/components/DesktopSiteShell";
import { DesktopStageCanvas } from "@/components/DesktopStageCanvas";
import { FilmHoverGif } from "@/components/FilmHoverGif";
import { InstallationLottie } from "@/components/InstallationLottie";
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
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import {
  EGWU_RECORDS_SLUG,
  getProjectBySlug,
  type ProjectDefinition,
} from "@/data/projects";

import "@/components/project/project-pane.css";

const DESIGN_PROJECT_PATH = `/design/${EGWU_RECORDS_SLUG}`;

type Props = {
  /** Direct visit to a project URL — same shell, already in project view. */
  initialProject?: ProjectDefinition;
};

/**
 * Desktop landing — same 2875×1623 stage + three-quadrant shell as EGWÚ.
 * Menu uses stage containment (shared off-axis position). Hover/bio/contact
 * overlays are authored in layout coordinates and scale with the stage.
 *
 * Clicking “design” keeps this shell and wheel mounted; the middle and
 * signature quadrants fill with the project in place (no route remount).
 */
export function HomeDesktop({ initialProject }: Props) {
  const [activeLabel, setActiveLabel] = useState(
    initialProject ? "design" : "contact",
  );
  const [hoverNavLabel, setHoverNavLabel] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectDefinition | null>(
    initialProject ?? null,
  );
  const [enteredFromLanding, setEnteredFromLanding] = useState(false);
  const [menuState, setMenuState] = useState<ProjectMenuState>("open");
  const [menuVeil, setMenuVeil] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [wheelInteracting, setWheelInteracting] = useState(false);
  const coarsePointer = useCoarsePointer();
  const m = getDesktopStageMetrics();
  const projectOpen = project != null;
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  const openDesignProject = useCallback(() => {
    if (projectRef.current) return;
    const next = getProjectBySlug(EGWU_RECORDS_SLUG);
    if (!next) return;
    setEnteredFromLanding(true);
    setMenuState("open");
    setMenuVeil(false);
    setProject(next);
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
    setMenuState("open");
    setMenuVeil(false);
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
        setMenuState("open");
        setMenuVeil(false);
        return;
      }
      const match = /^\/design\/([^/]+)/.exec(window.location.pathname);
      const next = match ? getProjectBySlug(match[1] ?? "") : undefined;
      setProject(next ?? null);
      setEnteredFromLanding(false);
      setMenuState("open");
      setMenuVeil(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const previewLabel = hoverNavLabel ?? activeLabel;
  const isContact = !projectOpen && previewLabel === "contact";
  const showAboutBio = !projectOpen && (previewLabel === "about" || isContact);
  const fadeMs = wheelInteracting
    ? 120
    : reduceMotion
      ? 80
      : 520;

  /** Clear signature column for bio; contact bar meets polaroid flush (no black gap). */
  const bioRightClearOfNzeribe = m.inset + m.nzeribeW + m.gapScaled;
  const contactBarRight = m.inset + m.frameW + 25;

  return (
    <DesignProjectNavProvider onProjectChange={onProjectChange}>
    <DesktopStageCanvas>
      <DesktopSiteShell
        layout="stage"
        showPolaroid={!projectOpen}
        menuState={projectOpen ? menuState : "open"}
        menuVeil={projectOpen && menuVeil}
        onOpenMenu={
          projectOpen
            ? () => {
                setMenuVeil(true);
                setMenuState("open");
              }
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
        onSignatureClick={projectOpen ? goToLanding : undefined}
        nav={
          <CircularNavWheel
            layout="desktop"
            containment="stage"
            spinFeel={coarsePointer ? "narrow" : "desktop"}
            initialActiveLabel={initialProject ? "design" : "contact"}
            onActiveLabelChange={setActiveLabel}
            onHoverLabelChange={setHoverNavLabel}
            onWheelInteractingChange={setWheelInteracting}
            onLabelActivate={(label) => {
              if (label === "design") openDesignProject();
            }}
          />
        }
        center={
          project ? (
            <div
              className={
                enteredFromLanding && !reduceMotion
                  ? "desktop-site-shell__center-slot desktop-site-shell__quadrant-fill"
                  : "desktop-site-shell__center-slot"
              }
            >
              <ProjectContentPane
                menuState={menuState}
                onMenuStateChange={(next) => {
                  setMenuState(next);
                  if (next === "hidden") setMenuVeil(false);
                }}
              >
                <div className="project-pane__chrome">
                  <ProjectIndexNav
                    activeNumber={project.number}
                    total={project.indexTotal}
                  />
                </div>
                <ProjectHeader project={project} menuState={menuState} />
                <ProjectCaseStudy project={project} menuState={menuState} />
              </ProjectContentPane>
            </div>
          ) : (
            <div className="h-full w-full" aria-hidden />
          )
        }
        stageOverlays={
          projectOpen ? null : (
            <>
              <DesignCluster
                visible={previewLabel === "design"}
                variant="desktop"
                stageLocked
              />
              <InstallationLottie
                visible={previewLabel === "installation"}
                layout="desktop"
                stageLocked
              />
              <PhotosHoverCluster
                visible={previewLabel === "photos"}
                variant="desktop"
                stageLocked
              />
              <FilmHoverGif
                visible={previewLabel === "film"}
                layout="desktop"
                stageLocked
              />
              <CvPressHoverAccordion
                visible={previewLabel === "cv + press"}
                layout="desktop"
                stageLocked
              />
              <SelectedWorksHoverGif
                visible={previewLabel === "select works"}
                layout="desktop"
                stageLocked
              />
              <ContactTopLinks
                visible={isContact}
                stageLocked
                top={`${m.inset}px`}
                left={`${DESKTOP_LAYOUT_BIO_LEFT}px`}
                right={`${contactBarRight}px`}
              />
              <div
                aria-hidden={!showAboutBio}
                className="pointer-events-none absolute z-[30] flex flex-row items-end"
                style={{
                  left: DESKTOP_LAYOUT_BIO_LEFT,
                  right: bioRightClearOfNzeribe,
                  bottom: m.inset,
                  opacity: showAboutBio ? 1 : 0,
                  transition: reduceMotion
                    ? "none"
                    : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
              >
                <AboutBio
                  visible={showAboutBio}
                  embedded
                  stageLocked
                  whiteBodyText={isContact}
                />
              </div>
            </>
          )
        }
      />
    </DesktopStageCanvas>
    </DesignProjectNavProvider>
  );
}
