import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { EgwuMerchPair } from "@/components/project/projects/egwu/EgwuMerchPair";
import { EGWU_MERCH_BANDANAS, EGWU_MERCH_SHIRTS } from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
  /** Kept for call-site parity; merchandise uses paired swap boxes. */
  gallery?: "coverflow" | "strip";
};

export function EgwuMerchandiseSection({
  menuState: _menuState,
}: Props) {
  return (
    <EgwuMerchPair shirts={EGWU_MERCH_SHIRTS} bandanas={EGWU_MERCH_BANDANAS} />
  );
}
