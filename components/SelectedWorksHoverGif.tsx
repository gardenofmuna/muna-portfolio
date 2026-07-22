"use client";

import { NavHubHoverGif } from "@/components/NavHubHoverGif";

type Props = {
  visible: boolean;
  layout?: "desktop" | "narrow";
};

export function SelectedWorksHoverGif({
  visible,
  layout = "desktop",
}: Props) {
  return (
    <NavHubHoverGif
      visible={visible}
      layout={layout}
      src="/VHS_PII_MUM.gif"
    />
  );
}
