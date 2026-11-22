"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { ExhibitionSlideshow } from "@/components/ExhibitionSlideshow";
import type {
  InstallationArchiveItem,
  InstallationChapter,
  InstallationGalleryImage,
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

function VinylQuote({ quote }: { quote: InstallationVinylQuote }) {
  if (quote.print) {
    /* Fixed composition, as printed: scales with the page, never rewraps. */
    return (
      <figure
        className="installation-vinyl installation-vinyl--print"
        data-wide={quote.print.width > 900 ? "" : undefined}
        style={{
          aspectRatio: `${quote.print.width} / ${quote.print.height}`,
          /* One shared scale for every quote, so they keep their printed
             sizes relative to each other: the 49 mm orange vinyl lettering
             comes out at body size, the smaller collage quotes smaller. */
          width: `calc(var(--is-body-size, 44px) * ${(
            (quote.print.width / quote.print.type) *
            Math.max(MIN_RELATIVE_TYPE, quote.print.type / PRINT_REF_TYPE_MM)
          ).toFixed(3)})`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={quote.print.src}
          alt={`${quote.text} ${quote.credit.join(". ")}`}
          width={quote.print.width}
          height={quote.print.height}
          className="installation-vinyl__print"
        />
      </figure>
    );
  }
  return (
    <figure
      className="installation-vinyl"
      data-tone={quote.tone ?? "orange"}
    >
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
      <Image
        src={image.src!}
        alt={image.alt}
        fill
        sizes={isDesktop ? "900px" : "92vw"}
        className="object-contain"
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
              <Image
                src={item.image.src!}
                alt={item.image.alt}
                fill
                sizes="92vw"
                className="object-contain"
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
  const caps = row.map((it) => capHeight(it.image)).filter((h): h is number => h !== null);
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
          <Image
            src={item.image.src!}
            alt={item.image.alt}
            fill
            sizes="450px"
            className="object-contain"
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
  return (
    <div
      className="installation-chapters"
      style={{ ["--is-accent" as string]: accent } as CSSProperties}
    >
      {chapters.map((ch) => {
        type Pic =
          | { kind: "view"; image: InstallationGalleryImage }
          | { kind: "item"; item: InstallationArchiveItem };
        const pics: Pic[] = [
          ...(ch.views ?? []).map((image) => ({ kind: "view" as const, image })),
          ...(ch.archive ?? []).map((item) => ({ kind: "item" as const, item })),
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
              <Image
                src={pic.image.src!}
                alt={pic.image.alt}
                fill
                sizes={isDesktop ? "450px" : "92vw"}
                className="object-contain"
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
                <Image
                  src={pic.item.image.src!}
                  alt={pic.item.image.alt}
                  fill
                  sizes={isDesktop ? "450px" : "92vw"}
                  className="object-contain"
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
              <FullImage key={pic.image.src} image={pic.image} isDesktop={isDesktop} />,
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
