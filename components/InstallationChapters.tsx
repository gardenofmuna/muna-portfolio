"use client";

import { BookTitles } from "@/components/BookTitles";
import { SizedImg } from "@/components/SizedImg";
import { useLayoutEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import { ExhibitionSlideshow } from "@/components/ExhibitionSlideshow";
import type {
  InstallationArchiveItem,
  InstallationChapter,
  InstallationGalleryImage,
  InstallationGridRow,
  InstallationVinylQuote,
} from "@/data/installation";

/**
 * Exhibition chapters, built from the same pieces as the other installation
 * pages: body-size type, full-width images, two-up galleries at one shared
 * height, and one-line Garamont captions. Wall quotes are set in the body
 * face, in the colour the vinyl had on the wall.
 */

/** Type height (mm) of the large orange vinyls; it maps to body text size. */
const PRINT_REF_TYPE_MM = 49;
/** Smaller quotes stay smaller, but never under 70% of body size, to stay legible. */
const MIN_RELATIVE_TYPE = 0.7;
/** The orange vinyls are set a touch larger than body size. */
const ORANGE_SCALE = 1.18;

function VinylQuote({ quote }: { quote: InstallationVinylQuote }) {
  if (quote.print) {
    /* Fixed composition, as printed: scales with the page, never rewraps. */
    return (
      <figure
        className="installation-vinyl installation-vinyl--print"
        data-wide={quote.print.width > 900 ? "" : undefined}
        data-tone={quote.tone ?? "orange"}
        style={{
          aspectRatio: `${quote.print.width} / ${quote.print.height}`,
          /* One shared scale for every quote, so they keep their printed
             sizes relative to each other: the 49 mm orange vinyl lettering
             comes out at body size, the smaller collage quotes smaller. */
          width: `calc(var(--is-body-size, 44px) * ${(
            (quote.print.width / quote.print.type) *
            Math.max(MIN_RELATIVE_TYPE, quote.print.type / PRINT_REF_TYPE_MM) *
            ((quote.tone ?? "orange") === "orange" ? ORANGE_SCALE : 1)
          ).toFixed(3)})`,
        }}
      >
        {/* Phones get a pre-rendered image of the print: the vector outlines
            are heavy (up to ~900 KB each) and slow to redraw while scrolling,
            which made the quotes blank or flicker. Desktop keeps the vector. */}
        <picture style={{ display: "contents" }}>
          <source
            media="(max-width: 899px)"
            type="image/webp"
            srcSet={quote.print.src.replace(/\.svg$/, "-m.webp")}
          />
          <img
            src={quote.print.src}
            alt={`${quote.text} ${quote.credit.join(". ")}`}
            width={quote.print.width}
            height={quote.print.height}
            className="installation-vinyl__print"
            decoding="async"
          />
        </picture>
      </figure>
    );
  }
  return (
    <figure className="installation-vinyl" data-tone={quote.tone ?? "orange"}>
      <blockquote className="installation-vinyl__text">{quote.text}</blockquote>
      <figcaption className="installation-vinyl__credit">
        {quote.credit.join(". ")}
      </figcaption>
    </figure>
  );
}

function FullImage({
  image,
  isDesktop,
}: {
  image: InstallationGalleryImage;
  isDesktop: boolean;
}) {
  return (
    <div
      className="installation-show__collage installation-wide"
      style={{
        aspectRatio: `${image.width} / ${image.height}`,
        /* Tall views stop at about one screen high, like the landscape ones. */
        maxWidth: isDesktop
          ? `calc((100vh - 160px) * ${image.width / image.height})`
          : undefined,
      }}
    >
      <SizedImg
        src={image.src!}
        width={image.width}
        height={image.height}
        alt={image.alt}
        sizes="(min-width: 900px) 70vw, 92vw"
        className="efuru-fill"
      />
    </div>
  );
}

/** Caption laid out like the printed wall labels. */
function Label({
  item,
  credit,
}: {
  item: InstallationArchiveItem;
  credit?: string;
}) {
  return (
    <div className="installation-label">
      <p className="installation-label__title">{item.title}</p>
      <p className="installation-label__date">{item.date}</p>
      {item.lines?.map((line, i) => (
        <p
          key={line}
          className={
            i === 0 ? "installation-label__maker" : "installation-label__line"
          }
        >
          {line}
        </p>
      ))}
      {credit ? <p className="installation-label__credit">{credit}</p> : null}
    </div>
  );
}

/**
 * Low-resolution copies are never shown larger than they hold up: at most
 * two thirds of their pixel size, so they read as small prints, not blurry
 * enlargements. Sharp scans (1000 px and up) are left alone.
 */
const LOW_RES_PX = 1000;
const LOW_RES_SHOW = 1 / 1.5;
function capHeight(img: InstallationGalleryImage): number | null {
  return img.width < LOW_RES_PX ? img.height * LOW_RES_SHOW : null;
}

/** Scans in pairs, both at one height filling the column, captions beneath. */
function ArchiveRow({
  row,
  isDesktop,
  credit,
}: {
  row: readonly InstallationArchiveItem[];
  isDesktop: boolean;
  credit?: string;
}) {
  if (!isDesktop) {
    return (
      <>
        {row.map((item) => (
          <figure key={item.title} className="installation-archive__single">
            <div
              className="installation-archive__img"
              style={{
                aspectRatio: `${item.image.width} / ${item.image.height}`,
                maxWidth:
                  item.image.width < LOW_RES_PX
                    ? `${Math.round(item.image.width * LOW_RES_SHOW)}px`
                    : undefined,
              }}
            >
              <SizedImg
                src={item.image.src!}
                width={item.image.width}
                height={item.image.height}
                alt={item.image.alt}
                sizes="92vw"
                className="efuru-fill"
              />
            </div>
            <figcaption>
              <Label item={item} credit={credit} />
            </figcaption>
          </figure>
        ))}
      </>
    );
  }
  const ars = row.map((it) => it.image.width / it.image.height);
  /* A lone scan takes the width it would have beside a 4:3 partner. */
  const cols =
    row.length === 2 ? `${ars[0]}fr ${ars[1]}fr` : `${ars[0]}fr ${4 / 3}fr`;
  /* If either scan is low-res, shrink the whole pair to the height it holds up at. */
  const caps = row
    .map((it) => capHeight(it.image))
    .filter((h): h is number => h !== null);
  const rowH = caps.length ? Math.min(...caps) : null;
  const rowMaxW =
    rowH !== null
      ? Math.round(
          ars.reduce((a, b) => a + b, 0) * rowH +
            (row.length === 1 ? (4 / 3) * rowH : 0) +
            6,
        )
      : null;
  return (
    <div
      className="installation-archive__row"
      style={
        {
          gridTemplateColumns: cols,
          maxWidth: rowMaxW ? `${rowMaxW}px` : undefined,
        } as CSSProperties
      }
    >
      {row.map((item) => (
        <div
          key={item.title}
          className="installation-archive__img"
          style={{ aspectRatio: `${item.image.width} / ${item.image.height}` }}
        >
          <SizedImg
            src={item.image.src!}
            width={item.image.width}
            height={item.image.height}
            alt={item.image.alt}
            sizes="(min-width: 900px) 40vw, 92vw"
            className="efuru-fill"
          />
        </div>
      ))}
      {row.length === 1 ? <div /> : null}
      {row.map((item) => (
        <Label key={`${item.title}-cap`} item={item} credit={credit} />
      ))}
    </div>
  );
}

/** Caption text with *italic* titles. */
function CaptionText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*[^*]+\*)/)
        .map((part, i) =>
          part.startsWith("*") && part.endsWith("*") ? (
            <i key={i}>{part.slice(1, -1)}</i>
          ) : (
            <BookTitles key={i} text={part} />
          ),
        )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hand-placed chapters on a 12-column grid                            */
/* ------------------------------------------------------------------ */

type Resolved =
  | { kind: "quote"; quote: InstallationVinylQuote }
  | { kind: "view"; image: InstallationGalleryImage }
  | { kind: "item"; item: InstallationArchiveItem }
  | { kind: "slideshow" };

/**
 * Finds a cell's content anywhere on the page, so rows can group pictures by
 * size rather than by chapter. Refs are file names: an archive scan or view
 * ("pmgs-staff-1953", "wall-memory-full"), a quote's print ("vinyl-a"), or
 * "slideshow".
 */
function resolve(
  all: readonly InstallationChapter[],
  ref: string,
): Resolved | null {
  if (ref === "slideshow") return { kind: "slideshow" };
  const ends = (src: string | undefined, ext: string) =>
    !!src && src.endsWith(`/${ref}.${ext}`);
  for (const ch of all) {
    const quote = [
      ...ch.quotes,
      ...(ch.closingQuote ? [ch.closingQuote] : []),
    ].find((q) => ends(q.print?.src, "svg"));
    if (quote) return { kind: "quote", quote };
    const image = ch.views?.find((v) => ends(v.src, "webp"));
    if (image) return { kind: "view", image };
    const item = ch.archive?.find((it) => ends(it.image.src, "webp"));
    if (item) return { kind: "item", item };
  }
  return null;
}

/** Picture box: fills its columns, except low-res scans, which stop at the
 *  size they hold up at and sit on the column's left edge. */
function PicBox({
  image,
  sizes,
  printHeight,
}: {
  image: InstallationGalleryImage;
  sizes: string;
  /** Small prints: every picture in the row at this one height (px). */
  printHeight?: number;
}) {
  const ar = image.width / image.height;
  return (
    <div
      className="efuru-pic"
      style={
        printHeight
          ? {
              aspectRatio: `${image.width} / ${image.height}`,
              width: `${Math.round(printHeight * ar)}px`,
              maxWidth: "100%",
            }
          : {
              aspectRatio: `${image.width} / ${image.height}`,
              maxWidth:
                image.width < LOW_RES_PX
                  ? `${Math.round(image.width * LOW_RES_SHOW)}px`
                  : undefined,
            }
      }
    >
      <SizedImg
        src={image.src!}
        width={image.width}
        height={image.height}
        alt={image.alt}
        sizes={sizes}
        className="efuru-fill"
      />
    </div>
  );
}

function GridRow({
  all,
  row,
  isDesktop,
  credit,
  ariaLabel,
}: {
  all: readonly InstallationChapter[];
  row: InstallationGridRow;
  isDesktop: boolean;
  credit?: string;
  ariaLabel: string;
}) {
  const cells = row.cells
    .map((c) => ({ ...c, r: resolve(all, c.ref) }))
    .filter((c): c is typeof c & { r: Resolved } => c.r !== null);
  const sizesFor = (span: number) =>
    `(min-width: 900px) ${Math.ceil((span / 12) * 80)}vw, ${
      row.mobileCols === 3 ? 31 : row.mobileCols === 2 ? 46 : 92
    }vw`;
  const slideshow = (
    <ExhibitionSlideshow
      key="slideshow"
      images={all.find((c) => c.strip?.length)?.strip ?? []}
      ariaLabel={`${ariaLabel}: photographs of the gallery`}
    />
  );

  if (!isDesktop) {
    /* Phones: one column (two for paired pictures); quotes span the row. */
    return (
      <div
        className="efuru-row efuru-row--mobile"
        data-cols={row.mobileCols ?? 1}
        data-prints={row.printHeight ? "" : undefined}
      >
        {/* Rows list each quote just before the picture it sits beside,
            so on phones the quote comes first. Among the small prints the
            two-column grid holds: cells keep their desktop order, and the
            quote takes one column beside its print. */}
        {(row.printHeight
          ? [...cells].sort((a, b) => a.col - b.col)
          : cells
        ).map(({ ref, r, span, caption }) => {
          if (r.kind === "slideshow")
            return (
              <div key={ref} className="efuru-cell efuru-cell--full">
                {slideshow}
              </div>
            );
          if (r.kind === "quote")
            return (
              <div
                key={ref}
                className={
                  row.printHeight
                    ? "efuru-cell efuru-cell--quote"
                    : "efuru-cell efuru-cell--full"
                }
              >
                <VinylQuote quote={r.quote} />
              </div>
            );
          const image = r.kind === "view" ? r.image : r.item.image;
          return (
            <figure key={ref} className="efuru-cell efuru-cell--pic">
              <PicBox
                image={image}
                sizes={sizesFor(span)}
                printHeight={
                  row.printHeight
                    ? Math.round(row.printHeight * 0.7)
                    : undefined
                }
              />
              {r.kind === "item" ? (
                <figcaption className="efuru-label">
                  <Label item={r.item} credit={credit} />
                </figcaption>
              ) : caption ? (
                <figcaption className="installation-show__media-caption efuru-cell__caption">
                  <CaptionText text={caption} />
                </figcaption>
              ) : null}
            </figure>
          );
        })}
        {row.caption ? (
          <p className="installation-show__media-caption efuru-row__caption efuru-cell--full">
            {row.caption}
          </p>
        ) : null}
      </div>
    );
  }

  /* Desktop: row 1 holds pictures and quotes, row 2 the labels, so every
     label in a row starts on the same line. */
  return (
    <div
      className="efuru-row"
      data-align={row.align}
      data-prints={row.printHeight ? "" : undefined}
    >
      {cells.map(({ ref, r, col, span, edge }) => {
        const gc = `${col} / span ${span}`;
        if (r.kind === "slideshow")
          return (
            <div key={ref} className="efuru-cell" style={{ gridColumn: gc }}>
              {slideshow}
            </div>
          );
        if (r.kind === "quote")
          return (
            <div
              key={ref}
              className="efuru-cell efuru-cell--quote"
              data-edge={edge}
              style={{ gridColumn: gc }}
            >
              <VinylQuote quote={r.quote} />
            </div>
          );
        const image = r.kind === "view" ? r.image : r.item.image;
        return (
          <div
            key={ref}
            className="efuru-cell efuru-cell--pic"
            style={{ gridColumn: gc }}
          >
            <PicBox
              image={image}
              sizes={sizesFor(span)}
              printHeight={row.printHeight}
            />
          </div>
        );
      })}
      {cells.some(({ r }) => r.kind === "item")
        ? cells.map(({ ref, r, col, span }) =>
            r.kind === "item" ? (
              <div
                key={`${ref}-label`}
                className="efuru-label"
                style={{ gridColumn: `${col} / span ${span}`, gridRow: 2 }}
              >
                <Label item={r.item} credit={credit} />
              </div>
            ) : null,
          )
        : null}
      {cells.map(({ ref, r, col, span, caption }) =>
        caption && r.kind !== "quote" ? (
          <p
            key={`${ref}-caption`}
            className="installation-show__media-caption efuru-cell__caption"
            style={{ gridColumn: `${col} / span ${span}`, gridRow: 2 }}
          >
            <CaptionText text={caption} />
          </p>
        ) : null,
      )}
      {row.caption ? (
        <p
          className="installation-show__media-caption efuru-row__caption"
          style={{ gridColumn: "1 / -1", gridRow: 2 }}
        >
          {row.caption}
        </p>
      ) : null}
    </div>
  );
}

export function InstallationChapters({
  chapters,
  archiveCredit,
  accent,
  isDesktop,
  ariaLabel,
}: {
  chapters: readonly InstallationChapter[];
  archiveCredit?: string;
  accent: string;
  isDesktop: boolean;
  ariaLabel: string;
}) {
  let quoteSide = 0;
  const rootRef = useRef<HTMLDivElement>(null);
  /* The small black quotes stand as tall as a small print with its label:
     measured from the top of the prints beside "Efuru was her name" to the
     bottom of their longest label, and kept in step on resize. */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!isDesktop) {
      root.classList.remove("efuru-quotes-matched");
      return;
    }
    const measure = () => {
      const row = [
        ...root.querySelectorAll<HTMLElement>(".efuru-row[data-prints]"),
      ].find((r) => r.querySelector(".efuru-cell--quote"));
      if (!row) return;
      const pics = [
        ...row.querySelectorAll<HTMLElement>(":scope > .efuru-cell--pic"),
      ];
      const labels = [
        ...row.querySelectorAll<HTMLElement>(":scope > .efuru-label"),
      ];
      if (!pics.length || !labels.length) return;
      const top = Math.min(...pics.map((p) => p.getBoundingClientRect().top));
      const bottom = Math.max(
        ...labels.map((l) => l.getBoundingClientRect().bottom),
      );
      /* The desktop stage is scaled to the window: convert screen pixels
         back to layout pixels before setting a CSS height. */
      const scale =
        row.getBoundingClientRect().height / (row.offsetHeight || 1) || 1;
      root.style.setProperty(
        "--efuru-print-block",
        `${Math.round((bottom - top) / scale)}px`,
      );
      root.classList.add("efuru-quotes-matched");
    };
    measure();
    const ro = new ResizeObserver(measure);
    root
      .querySelectorAll(".efuru-row[data-prints] > .efuru-label")
      .forEach((l) => ro.observe(l));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isDesktop]);
  return (
    <div
      ref={rootRef}
      className="installation-chapters"
      style={{ ["--is-accent" as string]: accent } as CSSProperties}
    >
      {chapters.map((ch) => {
        if (ch.rows?.length) {
          return (
            <section
              key={ch.number}
              className="installation-chapter efuru-chapter"
              aria-label={ch.title}
            >
              {ch.rows.map((row, i) => (
                <GridRow
                  key={i}
                  all={chapters}
                  row={row}
                  isDesktop={isDesktop}
                  credit={archiveCredit}
                  ariaLabel={ariaLabel}
                />
              ))}
            </section>
          );
        }
        type Pic =
          | { kind: "view"; image: InstallationGalleryImage }
          | { kind: "item"; item: InstallationArchiveItem };
        const pics: Pic[] = [
          ...(ch.views ?? []).map((image) => ({
            kind: "view" as const,
            image,
          })),
          ...(ch.archive ?? []).map((item) => ({
            kind: "item" as const,
            item,
          })),
        ];
        const quotes = [
          ...ch.quotes,
          ...(ch.closingQuote ? [ch.closingQuote] : []),
        ];
        /* Each quote opens a row with a picture beside it, spread evenly. */
        const pairedAt = new Map<number, InstallationVinylQuote>();
        const nPair = Math.min(quotes.length, pics.length);
        for (let k = 0; k < nPair; k++) {
          pairedAt.set(Math.floor((k * pics.length) / nPair), quotes[k]);
        }
        const loose = quotes.slice(nPair);

        const renderPic = (pic: Pic) =>
          pic.kind === "view" ? (
            <div
              className="installation-archive__img"
              style={{
                aspectRatio: `${pic.image.width} / ${pic.image.height}`,
              }}
            >
              <SizedImg
                src={pic.image.src!}
                width={pic.image.width}
                height={pic.image.height}
                alt={pic.image.alt}
                sizes="(min-width: 900px) 40vw, 92vw"
                className="efuru-fill"
              />
            </div>
          ) : (
            <>
              <div
                className="installation-archive__img"
                style={{
                  aspectRatio: `${pic.item.image.width} / ${pic.item.image.height}`,
                  maxWidth:
                    pic.item.image.width < LOW_RES_PX
                      ? `${Math.round(pic.item.image.width * LOW_RES_SHOW)}px`
                      : undefined,
                }}
              >
                <SizedImg
                  src={pic.item.image.src!}
                  width={pic.item.image.width}
                  height={pic.item.image.height}
                  alt={pic.item.image.alt}
                  sizes="(min-width: 900px) 40vw, 92vw"
                  className="efuru-fill"
                />
              </div>
              <Label item={pic.item} credit={archiveCredit} />
            </>
          );

        const flow: ReactNode[] = [];
        let buffer: InstallationArchiveItem[] = [];
        const flush = () => {
          for (let i = 0; i < buffer.length; i += 2) {
            const row = buffer.slice(i, i + 2);
            flow.push(
              <ArchiveRow
                key={row[0].title}
                row={row}
                isDesktop={isDesktop}
                credit={archiveCredit}
              />,
            );
          }
          buffer = [];
        };
        pics.forEach((pic, i) => {
          const quote = pairedAt.get(i);
          if (quote) {
            flush();
            const right = quoteSide++ % 2 === 1;
            flow.push(
              <div
                key={`qp-${i}`}
                className="installation-quote-row"
                data-quote-side={right ? "right" : "left"}
              >
                <div className="installation-quote-row__quote">
                  <VinylQuote quote={quote} />
                </div>
                <div className="installation-quote-row__pic">
                  {renderPic(pic)}
                </div>
              </div>,
            );
          } else if (pic.kind === "view") {
            flush();
            flow.push(
              <FullImage
                key={pic.image.src}
                image={pic.image}
                isDesktop={isDesktop}
              />,
            );
          } else {
            buffer.push(pic.item);
          }
        });
        flush();
        /* Quotes left over once every picture has one stay on their own. */
        loose.forEach((q, i) =>
          flow.push(
            <div
              key={`loose-${i}`}
              className="installation-vinyl-group"
              data-side="left"
            >
              <VinylQuote quote={q} />
            </div>,
          ),
        );
        if (ch.strip?.length) {
          flow.push(
            <ExhibitionSlideshow
              key="strip"
              images={ch.strip}
              ariaLabel={`${ariaLabel}: photographs of the gallery`}
            />,
          );
        }
        return (
          <section
            key={ch.number}
            className="installation-chapter"
            aria-label={ch.title}
          >
            {flow}
          </section>
        );
      })}
    </div>
  );
}
