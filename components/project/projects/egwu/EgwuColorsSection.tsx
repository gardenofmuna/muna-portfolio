import Image from "next/image";

import { EGWU_COLORS } from "@/data/projects";

export function EgwuColorsSection() {
  return (
    <figure className="project-asset-single project-asset-single--colors">
      <Image
        src={EGWU_COLORS.src}
        alt={EGWU_COLORS.alt}
        width={EGWU_COLORS.width}
        height={EGWU_COLORS.height}
        className="project-asset-single__image"
        sizes="561px"
      />
    </figure>
  );
}
