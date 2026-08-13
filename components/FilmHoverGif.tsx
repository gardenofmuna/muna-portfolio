"use client";

import { NavHubHoverGif } from "@/components/NavHubHoverGif";

type Props = {
  visible: boolean;
  layout?: "desktop" | "narrow";
  stageLocked?: boolean;
};

export function FilmHoverGif({
  visible,
  layout = "desktop",
  stageLocked = false,
}: Props) {
  return (
    <NavHubHoverGif
      visible={visible}
      layout={layout}
      stageLocked={stageLocked}
      src="/S8GIF.gif"
      narrowScaleMultiplier={1.08}
    />
  );
}
