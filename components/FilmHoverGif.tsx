"use client";

import { NavHubHoverGif } from "@/components/NavHubHoverGif";

type Props = {
  visible: boolean;
  layout?: "desktop" | "narrow";
};

export function FilmHoverGif({
  visible,
  layout = "desktop",
}: Props) {
  return (
    <NavHubHoverGif
      visible={visible}
      layout={layout}
      src="/S8GIF.gif"
      narrowScaleMultiplier={1.08}
    />
  );
}
