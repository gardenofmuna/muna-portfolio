import { CoverFlowCarousel } from "@/components/project/CoverFlowCarousel";
import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { EGWU_MERCHANDISE } from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
  gallery?: "coverflow" | "strip";
};

export function EgwuMerchandiseSection({
  menuState: _menuState,
  gallery = "coverflow",
}: Props) {
  if (gallery === "strip") {
    return (
      <ProjectHorizontalStrip
        items={EGWU_MERCHANDISE}
        ariaLabel="EGWÚ Records merchandise"
        variant="merchandise"
      />
    );
  }

  return (
    <CoverFlowCarousel
      items={EGWU_MERCHANDISE}
      ariaLabel="EGWÚ Records merchandise"
      itemNoun="Merchandise item"
      initialIndex={0}
      variant="merchandise"
    />
  );
}
