"use client";

import { HomeDesktop } from "@/components/HomeDesktop";
import { HomeNarrow } from "@/components/HomeNarrow";
import { useLayoutMode } from "@/hooks/useLayoutMode";

type Props = {
  initialShowId: string;
};

/** Deep-link entry for `/installation/[id]` — same shells as home. */
export function InstallationEntryClient({ initialShowId }: Props) {
  const { mode, ready } = useLayoutMode();

  if (!ready) {
    return <div className="absolute inset-0 bg-white" aria-hidden />;
  }

  return mode === "narrow" ? (
    <HomeNarrow initialInstallationId={initialShowId} />
  ) : (
    <HomeDesktop initialInstallationId={initialShowId} />
  );
}
