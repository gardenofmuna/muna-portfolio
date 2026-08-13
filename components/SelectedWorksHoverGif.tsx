"use client";

import { NavHubHoverGif } from "@/components/NavHubHoverGif";

type Props = {
  visible: boolean;
  layout?: "desktop" | "narrow";
  stageLocked?: boolean;
};

export function SelectedWorksHoverGif({
  visible,
  layout = "desktop",
  stageLocked = false,
}: Props) {
  return (
    <NavHubHoverGif
      visible={visible}
      layout={layout}
      stageLocked={stageLocked}
      src="/VHS_PII_MUM.gif"
    />
  );
}
