import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InstallationEntryClient } from "@/components/InstallationEntryClient";
import {
  INSTALLATION_SHOWS,
  getInstallationShowById,
} from "@/data/installation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const show = getInstallationShowById(id);
  if (!show) return {};
  return {
    title: `${show.titleLines.join(" ")} | Muna | Portfolio`,
  };
}

export function generateStaticParams() {
  return INSTALLATION_SHOWS.map((show) => ({ id: show.id }));
}

export default async function InstallationShowRoute({ params }: PageProps) {
  const { id } = await params;
  const show = getInstallationShowById(id);
  if (!show) notFound();
  return <InstallationEntryClient initialShowId={show.id} />;
}
