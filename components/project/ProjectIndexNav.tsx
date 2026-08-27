"use client";

import Link from "next/link";

import { useInPlaceDesignLink } from "@/components/project/DesignProjectNav";
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

function IndexLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: string;
}) {
  const linkProps = useInPlaceDesignLink(href);
  return (
    <Link className={className} {...linkProps}>
      {children}
    </Link>
  );
}

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
            <IndexLink
              key={numeral}
              href={`/design/${slug}`}
              className={className}
            >
              {numeral}
            </IndexLink>
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
