import Image from "next/image";

import { EGWU_LOGOS } from "@/data/projects";
import type { ProjectMenuState } from "@/components/project/ProjectContentPane";

type Props = {
  menuState: ProjectMenuState;
};

export function EgwuLogoSection({ menuState }: Props) {
  const [vertical, wordmark, badge] = EGWU_LOGOS;

  return (
    <div className="project-egwu-logos" data-menu-state={menuState}>
      <figure className="project-egwu-logos__primary">
        <Image
          src={vertical.src}
          alt={vertical.alt}
          width={vertical.width}
          height={vertical.height}
          className="project-egwu-logos__image"
          sizes="11rem"
        />
      </figure>
      <div className="project-egwu-logos__secondary">
        <figure className="project-egwu-logos__figure">
          <Image
            src={wordmark.src}
            alt={wordmark.alt}
            width={wordmark.width}
            height={wordmark.height}
            className="project-egwu-logos__image"
            sizes="22rem"
          />
        </figure>
        <figure className="project-egwu-logos__figure">
          <Image
            src={badge.src}
            alt={badge.alt}
            width={badge.width}
            height={badge.height}
            className="project-egwu-logos__image"
            sizes="18rem"
          />
        </figure>
      </div>
    </div>
  );
}
