import type { ProjectDefinition } from "@/data/projects";

import type { ProjectMenuState } from "@/components/project/ProjectContentPane";

type Props = {
  project: ProjectDefinition;
  menuState: ProjectMenuState;
};

export function ProjectHeader({ project, menuState }: Props) {
  return (
    <header className="project-header" data-menu-state={menuState}>
      <h1
        className="project-header__title"
        data-long={project.title.replace(/\s/g, "").length > 13 ? "" : undefined}
      >
        {project.title}
      </h1>
      <p className="project-header__description project-body-copy">
        {project.description}
      </p>
      <ul
        className="project-header__section-links"
        aria-label="Project sections"
      >
        {project.sectionLinks.map((link) => (
          <li key={link.id}>
            <a
              className="project-header__section-link"
              href={`#${link.id}`}
              style={{ color: link.color }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
}
