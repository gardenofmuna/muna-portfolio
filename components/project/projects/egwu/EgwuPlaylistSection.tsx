import Image from "next/image";

import type { ProjectMenuState } from "@/components/project/ProjectContentPane";
import { EGWU_PLAYLIST_COVER } from "@/data/projects";

type Props = {
  menuState: ProjectMenuState;
};

export function EgwuPlaylistSection({ menuState }: Props) {
  return (
    <figure
      className="project-asset-single project-asset-single--playlist"
      data-menu-state={menuState}
    >
      <Image
        src={EGWU_PLAYLIST_COVER.src}
        alt={EGWU_PLAYLIST_COVER.alt}
        width={EGWU_PLAYLIST_COVER.width}
        height={EGWU_PLAYLIST_COVER.height}
        className="project-asset-single__image"
        sizes="100vw"
      />
    </figure>
  );
}
