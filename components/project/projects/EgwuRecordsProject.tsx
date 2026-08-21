import type { ProjectMenuState } from "@/components/project/ProjectContentPane";

import { ProjectFooter } from "@/components/project/ProjectFooter";
import { ProjectSection } from "@/components/project/ProjectSection";
import { EgwuColorsSection } from "@/components/project/projects/egwu/EgwuColorsSection";
import { EgwuLogoSection } from "@/components/project/projects/egwu/EgwuLogoSection";
import { EgwuMerchandiseSection } from "@/components/project/projects/egwu/EgwuMerchandiseSection";
import { EgwuPlaylistSection } from "@/components/project/projects/egwu/EgwuPlaylistSection";
import { EgwuPostersSection } from "@/components/project/projects/egwu/EgwuPostersSection";

type Props = {
  menuState: ProjectMenuState;
  /** Desktop keeps cover-flow; mobile Figma uses a horizontal strip. */
  gallery?: "coverflow" | "strip";
};

export function EgwuRecordsProject({
  menuState,
  gallery = "coverflow",
}: Props) {
  return (
    <div className="project-sections" data-menu-state={menuState}>
      <ProjectSection id="logo" title="Logo">
        <EgwuLogoSection menuState={menuState} />
      </ProjectSection>
      <ProjectSection id="colors" title="Colors">
        <EgwuColorsSection />
      </ProjectSection>
      <ProjectSection id="posters" title="Posters">
        <EgwuPostersSection menuState={menuState} gallery={gallery} />
      </ProjectSection>
      <ProjectSection id="merchandise" title="Merchandise">
        <EgwuMerchandiseSection menuState={menuState} gallery={gallery} />
      </ProjectSection>
      <ProjectSection id="playlist-cover" title="Playlist Cover">
        <EgwuPlaylistSection menuState={menuState} />
      </ProjectSection>
      <ProjectFooter />
    </div>
  );
}

export { EGWU_RECORDS_SLUG } from "@/data/projects";
