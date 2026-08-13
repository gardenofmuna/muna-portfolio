"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

export type ProjectMenuState = "open" | "hidden";

type ProjectScrollApi = {
  scrollToTop: () => void;
};

const ProjectScrollContext = createContext<ProjectScrollApi | null>(null);

export function useProjectScroll() {
  return useContext(ProjectScrollContext);
}

type Props = {
  menuState: ProjectMenuState;
  onMenuStateChange: (state: ProjectMenuState) => void;
  children: ReactNode;
};

const SCROLL_HIDE_THRESHOLD = 48;

export function ProjectContentPane({
  menuState,
  onMenuStateChange,
  children,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop > SCROLL_HIDE_THRESHOLD) {
      onMenuStateChange("hidden");
    } else if (el.scrollTop <= 8) {
      onMenuStateChange("open");
    }
  }, [onMenuStateChange]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <ProjectScrollContext.Provider value={{ scrollToTop }}>
      <div className="project-pane" data-menu-state={menuState}>
        <div
          ref={scrollRef}
          className="project-pane__scroll"
          onScroll={handleScroll}
        >
          <div className="project-pane__inner">{children}</div>
        </div>
      </div>
    </ProjectScrollContext.Provider>
  );
}
