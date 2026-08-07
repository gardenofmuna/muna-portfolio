"use client";

type Props = {
  previousLabel?: string;
  nextLabel?: string;
};

export function ProjectFooter({
  previousLabel = "STUDIO ORRY",
  nextLabel = "DOC NOW 2025",
}: Props) {
  return (
    <footer className="project-footer">
      <div className="project-footer__nav">
        <p className="project-footer__label">Back</p>
        <p className="project-footer__project project-footer__project--placeholder">
          {previousLabel}
        </p>
      </div>
      <button
        type="button"
        className="project-footer__top"
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ^
      </button>
      <div className="project-footer__nav project-footer__nav--next">
        <p className="project-footer__label">Next</p>
        <p className="project-footer__project project-footer__project--placeholder">
          {nextLabel}
        </p>
      </div>
    </footer>
  );
}
