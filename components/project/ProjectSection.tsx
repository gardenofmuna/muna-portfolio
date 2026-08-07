import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  children: ReactNode;
};

export function ProjectSection({ id, title, children }: Props) {
  return (
    <section className="project-section" id={id} aria-labelledby={`${id}-heading`}>
      <h2 className="project-section__title" id={`${id}-heading`}>
        {title}
      </h2>
      <div className="project-section__body">{children}</div>
    </section>
  );
}
