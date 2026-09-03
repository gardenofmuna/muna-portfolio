"use client";

import { HomeDesktop } from "@/components/HomeDesktop";
import { HomeNarrow } from "@/components/HomeNarrow";
import { useLayoutMode } from "@/hooks/useLayoutMode";

export default function HomePage() {
  const { cssMode, ready } = useLayoutMode();
  const narrowOn = !ready || cssMode === "narrow";
  const desktopOn = !ready || cssMode === "desktop";

  return (
    <>
      <div
        className="home-narrow-root"
        aria-hidden={!narrowOn}
        inert={!narrowOn ? true : undefined}
      >
        <HomeNarrow interactive={narrowOn} />
      </div>
      <div
        className="home-desktop-root"
        aria-hidden={!desktopOn}
        inert={!desktopOn ? true : undefined}
      >
        <HomeDesktop interactive={desktopOn} />
      </div>
    </>
  );
}
