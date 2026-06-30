"use client";

import { HomeDesktop } from "@/components/HomeDesktop";
import { HomeNarrow } from "@/components/HomeNarrow";
import { useLayoutMode } from "@/hooks/useLayoutMode";

export default function HomePage() {
  const mode = useLayoutMode();
  return mode === "narrow" ? <HomeNarrow /> : <HomeDesktop />;
}
