import { CoverFlowCarousel } from "@/components/project/CoverFlowCarousel";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import {
  EGWU_MERCHANDISE,
  EGWU_MERCHANDISE_INITIAL_INDEX,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

export function EgwuMerchandiseSection({ menuState }: Props) {
  const isOpen = menuState === "open";

  return (
    <CoverFlowCarousel
      items={EGWU_MERCHANDISE}
      ariaLabel="EGWÚ Records merchandise"
      itemNoun="Merchandise item"
      initialIndex={EGWU_MERCHANDISE_INITIAL_INDEX}
      variant="merchandise"
      sideOffset={isOpen ? 74 : 80}
      neighbor1Scale={0.74}
      neighbor2Scale={0.58}
      maxRotation={22}
    />
  );
}
