"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * A plain-text version of the page (heading, dates, description, links),
 * written into the HTML on the server so search engines and link previews
 * can read it before any script runs. It mirrors what the visual page shows
 * and steps aside once that page has loaded, so nobody meets it twice.
 */
export function SeoSummary({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (mounted) return null;
  return <div className="sr-only">{children}</div>;
}
