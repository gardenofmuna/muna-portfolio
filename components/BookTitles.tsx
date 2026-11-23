import { Fragment } from "react";

/** Book titles that are always set in italics wherever they appear in text. */
const BOOK_TITLES = ["Efuru"];
const PATTERN = new RegExp(`\\b(${BOOK_TITLES.join("|")})\\b`, "g");

/** Renders text with every book title in italics (e.g. Flora Nwapa: *Efuru* at the Threshold). */
export function BookTitles({ text }: { text: string }) {
  const parts = text.split(PATTERN);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        BOOK_TITLES.includes(part) ? (
          <i key={i} className="book-title">
            {part}
          </i>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
