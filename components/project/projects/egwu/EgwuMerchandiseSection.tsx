import { CoverFlowCarousel } from "@/components/project/CoverFlowCarousel";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import {
  EGWU_MERCHANDISE,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

export function EgwuMerchandiseSection({ menuState: _menuState }: Props) {
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
