import Link from "next/link";

import { getProjectSlugByNumber } from "@/data/projects";

type Props = {
  activeNumber: string;
  total: number;
};

const ROMAN_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
] as const;

export function ProjectIndexNav({ activeNumber, total }: Props) {
  const numerals = ROMAN_NUMERALS.slice(0, total);

  return (
    <nav className="project-index-nav" aria-label="Project index">
      {numerals.map((numeral) => {
        const slug = getProjectSlugByNumber(numeral);
        const className =
          numeral === activeNumber
            ? "project-index-nav__item project-index-nav__item--active"
            : "project-index-nav__item";
        const isCurrent = numeral === activeNumber;

        if (slug && !isCurrent) {
          return (
            <Link
              key={numeral}
              href={`/design/${slug}`}
              className={className}
            >
              {numeral}
            </Link>
          );
        }

        return (
          <span
            key={numeral}
            className={className}
            aria-current={isCurrent ? "page" : undefined}
          >
            {numeral}
          </span>
        );
      })}
    </nav>
  );
}
