import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { EGWU_MERCHANDISE } from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
  /** Kept for call-site parity; merchandise always uses a horizontal strip. */
  gallery?: "coverflow" | "strip";
};

export function EgwuMerchandiseSection({
  menuState: _menuState,
}: Props) {
  return (
    <ProjectHorizontalStrip
      items={EGWU_MERCHANDISE}
      ariaLabel="EGWÚ Records merchandise"
      variant="merchandise"
    />
  );
}
