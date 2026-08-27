"use client";

import {
  createContext,
  useCallback,
  useContext,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  getProjectBySlug,
  type ProjectDefinition,
} from "@/data/projects";

type DesignProjectNav = {
  goToProject: (slug: string) => void;
};

const DesignProjectNavContext = createContext<DesignProjectNav | null>(null);

export function useDesignProjectNav() {
  return useContext(DesignProjectNavContext);
}

export function DesignProjectNavProvider({
  onProjectChange,
  children,
}: {
  onProjectChange: (project: ProjectDefinition) => void;
  children: ReactNode;
}) {
  const goToProject = useCallback(
    (slug: string) => {
      const next = getProjectBySlug(slug);
      if (!next) return;
      onProjectChange(next);
      document.title = `${next.title} | Muna | Portfolio`;
      const path = `/design/${next.slug}`;
      if (window.location.pathname !== path) {
        window.history.pushState({ munaProject: next.slug }, "", path);
      }
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>("[data-project-scroll]")
          ?.scrollTo({ top: 0 });
      });
    },
    [onProjectChange],
  );

  return (
    <DesignProjectNavContext.Provider value={{ goToProject }}>
      {children}
    </DesignProjectNavContext.Provider>
  );
}

export function designSlugFromHref(href?: string) {
  if (!href) return null;
  const match = /^\/design\/([^/?#]+)/.exec(href);
  return match?.[1] ?? null;
}

/** Left-click replaces the case study in place, like clicking “design”. */
export function useInPlaceDesignLink(href: string) {
  const nav = useDesignProjectNav();
  const slug = designSlugFromHref(href);

  return {
    href,
    scroll: false as const,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (!nav || !slug) return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      event.preventDefault();
      nav.goToProject(slug);
    },
  };
}
