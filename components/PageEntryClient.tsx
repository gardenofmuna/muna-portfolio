"use client";

import { HomeDesktop } from "@/components/HomeDesktop";
import { HomeNarrow } from "@/components/HomeNarrow";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import type { NarrowPage } from "@/lib/narrow-pages";

type Props = {
  page: NarrowPage;
};

/** Deep-link entry for `/about`, `/cv`, … — same shells as home. */
export function PageEntryClient({ page }: Props) {
  const { mode, ready } = useLayoutMode();

  if (!ready) {
    return <div className="absolute inset-0 bg-white" aria-hidden />;
  }

  return mode === "narrow" ? (
    <HomeNarrow initialPage={page} />
  ) : (
    <HomeDesktop initialLabel={page} />
  );
}
