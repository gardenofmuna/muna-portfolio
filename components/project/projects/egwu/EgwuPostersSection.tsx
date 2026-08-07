import { CoverFlowCarousel } from "@/components/project/CoverFlowCarousel";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import {
  EGWU_POSTERS,
  EGWU_POSTERS_INITIAL_INDEX,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

export function EgwuPostersSection({ menuState }: Props) {
  const isOpen = menuState === "open";

  return (
    <CoverFlowCarousel
      items={EGWU_POSTERS}
      ariaLabel="EGWÚ Records event posters"
      itemNoun="Poster"
      initialIndex={EGWU_POSTERS_INITIAL_INDEX}
      variant="poster"
      sideOffset={isOpen ? 86 : 92}
      neighbor1Scale={0.76}
      neighbor2Scale={0.6}
      maxRotation={28}
    />
  );
}
