import { CoverFlowCarousel } from "@/components/project/CoverFlowCarousel";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import {
  EGWU_POSTERS,
} from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

export function EgwuPostersSection({ menuState: _menuState }: Props) {
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
