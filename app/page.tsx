"use client";

import { HomeDesktop } from "@/components/HomeDesktop";
import { HomeNarrow } from "@/components/HomeNarrow";
import { useLayoutMode } from "@/hooks/useLayoutMode";

export default function HomePage() {
  const { mode, ready } = useLayoutMode();

  if (!ready) {
    return <div className="absolute inset-0 bg-white" aria-hidden />;
  }

  return mode === "narrow" ? <HomeNarrow /> : <HomeDesktop />;
}
