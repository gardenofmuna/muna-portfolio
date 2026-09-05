import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { EGWU_POSTERS } from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
  /** Kept for call-site parity; posters use a horizontal strip. */
  gallery?: "coverflow" | "strip";
};

export function EgwuPostersSection({
  menuState: _menuState,
}: Props) {
  return (
    <ProjectHorizontalStrip
      items={EGWU_POSTERS}
      ariaLabel="EGWÚ Records event posters"
      variant="poster"
    />
  );
}
