"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { AboutBio } from "@/components/AboutBio";
import { CircularNavWheel } from "@/components/CircularNavWheel";
import { ContactTopLinks } from "@/components/ContactTopLinks";
import { CvPressHoverAccordion } from "@/components/CvPressHoverAccordion";
import { DesignLandingIndex } from "@/components/DesignLandingIndex";
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
import {
  getProjectBySlug,
  type ProjectDefinition,
} from "@/data/projects";

import "@/components/project/project-pane.css";

type Props = {
  /** Direct visit to a project URL — same shell, already in project view. */
  initialProject?: ProjectDefinition;
};

/**
 * Desktop landing — same 2875×1623 stage + three-quadrant shell as EGWÚ.
 * Menu uses stage containment (shared off-axis position). Hover/bio/contact
 * overlays are authored in layout coordinates and scale with the stage.
 *
 * Dialing “design” shows the project index in the middle; clicking a row
 * opens that case study in place (no route remount).
 */
export function HomeDesktop({ initialProject }: Props) {
  const [activeLabel, setActiveLabel] = useState(
    initialProject ? "design" : "contact",
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

  const goToLanding = useCallback(() => {
    setProject(null);
    setEnteredFromLanding(false);
    setMenuState("open");
    setMenuVeil(false);
    startTransition(() => {
      setPaneProject(null);
    });
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, []);

  const onProjectChange = useCallback((next: ProjectDefinition) => {
    /* Fade in when leaving the landing index for a case study. */
    setEnteredFromLanding(projectRef.current == null);
    setMenuState("open");
    setMenuVeil(false);
    setProject(next);
    setPaneProject(next);
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname === "/") {
        setProject(null);
        setEnteredFromLanding(false);
        setMenuState("open");
        setMenuVeil(false);
        startTransition(() => setPaneProject(null));
        return;
      }
      const match = /^\/design\/([^/]+)/.exec(window.location.pathname);
      const next = match ? getProjectBySlug(match[1] ?? "") : undefined;
      setProject(next ?? null);
      setPaneProject(next ?? null);
      setEnteredFromLanding(false);
      setMenuState("open");
      setMenuVeil(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* Previews follow the dial only while clicking/dragging — not mouse hover. */
  const previewLabel =
    wheelInteracting && hoverNavLabel ? hoverNavLabel : activeLabel;
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
        showPolaroid={
          !projectOpen &&
          (previewLabel === "about" || previewLabel === "contact")
        }
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
        signatureCompact={projectOpen}
        nav={
          <CircularNavWheel
            layout="desktop"
            containment="stage"
            spinFeel="narrow"
            initialActiveLabel={initialProject ? "design" : "contact"}
            onActiveLabelChange={setActiveLabel}
            onHoverLabelChange={setHoverNavLabel}
            onWheelInteractingChange={setWheelInteracting}
          />
        }
        center={
          paneProject ? (
            <div
              className={
                enteredFromLanding && !reduceMotion
                  ? "desktop-site-shell__center-slot desktop-site-shell__quadrant-fill"
                  : "desktop-site-shell__center-slot"
              }
              style={
                projectOpen
                  ? undefined
                  : { visibility: "hidden", pointerEvents: "none" }
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
            hidden={projectOpen}
            aria-hidden={projectOpen}
          >
            <DesignLandingIndex
              visible={!projectOpen && previewLabel === "design"}
            />
            <InstallationLottie
              visible={!projectOpen && previewLabel === "installation"}
              layout="desktop"
              stageLocked
            />
            <PhotosHoverCluster
              visible={!projectOpen && previewLabel === "photos"}
              variant="desktop"
              stageLocked
            />
            <FilmHoverGif
              visible={!projectOpen && previewLabel === "film"}
              layout="desktop"
              stageLocked
            />
            <CvPressHoverAccordion
              visible={!projectOpen && previewLabel === "cv + press"}
              layout="desktop"
              stageLocked
            />
            <SelectedWorksHoverGif
              visible={!projectOpen && previewLabel === "select works"}
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
          </div>
        }
      />
    </DesktopStageCanvas>
    </DesignProjectNavProvider>
  );
}
