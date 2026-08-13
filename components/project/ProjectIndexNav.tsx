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
      {numerals.map((numeral) => (
        <span
          key={numeral}
          className={
            numeral === activeNumber
              ? "project-index-nav__item project-index-nav__item--active"
              : "project-index-nav__item"
          }
          aria-current={numeral === activeNumber ? "page" : undefined}
        >
          {numeral}
        </span>
      ))}
    </nav>
  );
}
