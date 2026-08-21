import { CoverFlowCarousel } from "@/components/project/CoverFlowCarousel";
import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { EGWU_POSTERS } from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
  gallery?: "coverflow" | "strip";
};

export function EgwuPostersSection({
  menuState: _menuState,
  gallery = "coverflow",
}: Props) {
  if (gallery === "strip") {
    return (
      <ProjectHorizontalStrip
        items={EGWU_POSTERS}
        ariaLabel="EGWÚ Records event posters"
        variant="poster"
      />
    );
  }

  return (
    <CoverFlowCarousel
      items={EGWU_POSTERS}
      ariaLabel="EGWÚ Records event posters"
      itemNoun="Poster"
      initialIndex={0}
      variant="poster"
    />
  );
}
