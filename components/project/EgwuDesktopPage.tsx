"use client";

import { useState } from "react";

import { CircularNavWheel } from "@/components/CircularNavWheel";
import { DesktopSiteShell } from "@/components/DesktopSiteShell";
import { DesktopStageCanvas } from "@/components/DesktopStageCanvas";
import { ProjectIndexNav } from "@/components/project/ProjectIndexNav";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import {
  ProjectContentPane,
  type ProjectMenuState,
} from "@/components/project/ProjectContentPane";
import { EgwuRecordsProject } from "@/components/project/projects/EgwuRecordsProject";
import type { ProjectDefinition } from "@/data/projects";

import "./project-pane.css";

type Props = {
  project: ProjectDefinition;
};

export function EgwuDesktopPage({ project }: Props) {
  const [menuState, setMenuState] = useState<ProjectMenuState>("open");

  return (
    <DesktopStageCanvas>
      <DesktopSiteShell
        layout="stage"
        showPolaroid={false}
        menuState={menuState}
        onOpenMenu={() => setMenuState("open")}
        nav={
          <CircularNavWheel
            layout="desktop"
            containment="stage"
            initialActiveLabel="design"
          />
        }
        center={
          <ProjectContentPane
            menuState={menuState}
            onMenuStateChange={setMenuState}
          >
            <div className="project-pane__chrome">
              <ProjectIndexNav
                activeNumber={project.number}
                total={project.indexTotal}
              />
            </div>
            <ProjectHeader project={project} menuState={menuState} />
            <EgwuRecordsProject menuState={menuState} />
          </ProjectContentPane>
        }
      />
    </DesktopStageCanvas>
  );
}
