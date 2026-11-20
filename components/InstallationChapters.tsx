"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
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
            quote.print.width / PRINT_REF_TYPE_MM
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
  return (
    <div
      className="installation-archive__row"
      style={{ gridTemplateColumns: cols } as CSSProperties}
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
        /* Everything with a picture in it, in reading order. */
        const rows: ReactNode[] = [];
        ch.views?.forEach((v) =>
          rows.push(<FullImage key={v.src} image={v} isDesktop={isDesktop} />),
        );
        if (ch.strip?.length) {
          rows.push(
            <div key="strip">
              <div className="installation-show__strip">
                <ProjectHorizontalStrip
                  items={ch.strip.map((img) => ({
                    src: img.src!,
                    width: img.width,
                    height: img.height,
                    alt: img.alt,
                  }))}
                  ariaLabel={`${ariaLabel}: ${ch.title}`}
                  variant="website"
                  mobileCutAutoplay={!isDesktop}
                />
              </div>
              {ch.stripCaption ? (
                <p className="installation-show__media-caption">
                  {ch.stripCaption}
                </p>
              ) : null}
            </div>,
          );
        }
        const items = ch.archive ?? [];
        for (let i = 0; i < items.length; i += 2) {
          const row = items.slice(i, i + 2);
          rows.push(
            <ArchiveRow
              key={row[0].title}
              row={row}
              isDesktop={isDesktop}
              credit={archiveCredit}
            />,
          );
        }
        /* Quotes fall between the picture rows, spread evenly. */
        const n = ch.quotes.length;
        const slotFor = (i: number) =>
          Math.floor(((i + 1) * rows.length) / (n + 1));
        const flow: ReactNode[] = [];
        let q = 0;
        for (let r = 0; r <= rows.length; r++) {
          while (q < n && slotFor(q) === r) {
            const quote = ch.quotes[q];
            flow.push(
              <div
                key={`q-${q}`}
                className="installation-vinyl-group"
                data-side={quoteSide++ % 2 ? "right" : "left"}
              >
                <VinylQuote quote={quote} />
              </div>,
            );
            q++;
          }
          if (r < rows.length) flow.push(rows[r]);
        }
        if (ch.closingQuote) {
          flow.push(
            <div
              key="closing"
              className="installation-vinyl-group"
              data-side={quoteSide++ % 2 ? "right" : "left"}
            >
              <VinylQuote quote={ch.closingQuote} />
            </div>,
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
