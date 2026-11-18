"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import { ProjectHorizontalStrip } from "@/components/project/ProjectHorizontalStrip";
import type {
  InstallationChapter,
  InstallationGalleryImage,
  InstallationVinylQuote,
} from "@/data/installation";

/**
 * Exhibition chapters: wall quotes set as type in the vinyl style (italic
 * Garamont in the show's orange, small sans credit), then installation views
 * and captioned scans laid out like the wall labels.
 */

function VinylQuote({
  quote,
  closing,
}: {
  quote: InstallationVinylQuote;
  closing?: boolean;
}) {
  return (
    <figure
      className="installation-chapter__vinyl"
      data-closing={closing ? "" : undefined}
    >
      <blockquote className="installation-chapter__vinyl-text">
        {quote.text}
      </blockquote>
      <figcaption className="installation-chapter__vinyl-credit">
        {quote.credit.map((line) => (
          <span key={line} className="installation-chapter__vinyl-credit-line">
            {line}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function ChapterImage({
  image,
  sizes,
  className,
}: {
  image: InstallationGalleryImage;
  sizes: string;
  className?: string;
}) {
  return (
    <div
      className={["installation-chapter__img", className]
        .filter(Boolean)
        .join(" ")}
      style={{ aspectRatio: `${image.width} / ${image.height}` }}
      data-portrait={image.height > image.width ? "" : undefined}
    >
      {image.src && !image.placeholder ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          className="object-contain"
        />
      ) : (
        <div
          className="installation-show__placeholder"
          role="img"
          aria-label={image.alt}
        />
      )}
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
  return (
    <div
      className="installation-chapters"
      style={{ ["--is-accent" as string]: accent } as CSSProperties}
    >
      {chapters.map((ch) => (
        <section
          key={ch.number}
          className="installation-chapter"
          aria-labelledby={`chapter-${ch.number}`}
        >
          <h2 id={`chapter-${ch.number}`} className="installation-chapter__head">
            <span className="installation-chapter__num">{ch.number}</span>
            <span className="installation-chapter__title">{ch.title}</span>
          </h2>

          {ch.quotes.map((q) => (
            <VinylQuote key={q.text.slice(0, 40)} quote={q} />
          ))}

          {ch.views?.map((v) => (
            <ChapterImage
              key={v.src ?? v.alt}
              image={v}
              className="installation-chapter__view"
              sizes={isDesktop ? "660px" : "92vw"}
            />
          ))}

          {ch.strip?.length ? (
            <div className="installation-show__strip installation-chapter__strip">
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
          ) : null}
          {ch.stripCaption ? (
            <p className="installation-show__media-caption">
              {ch.stripCaption}
            </p>
          ) : null}

          {ch.archive?.length ? (
            <ul className="installation-chapter__archive">
              {ch.archive.map((item) => (
                <li key={item.title} className="installation-chapter__item">
                  <ChapterImage
                    image={item.image}
                    className="installation-chapter__scan"
                    sizes={isDesktop ? "320px" : "92vw"}
                  />
                  <div className="installation-chapter__label">
                    <p className="installation-chapter__label-title">
                      {item.title}
                    </p>
                    <p className="installation-chapter__label-date">
                      {item.date}
                    </p>
                    {item.lines?.map((line, i) => (
                      <p
                        key={line}
                        className={
                          i === 0
                            ? "installation-chapter__label-maker"
                            : "installation-chapter__label-line"
                        }
                      >
                        {line}
                      </p>
                    ))}
                    {archiveCredit ? (
                      <p className="installation-chapter__label-credit">
                        {archiveCredit}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {ch.closingQuote ? (
            <VinylQuote quote={ch.closingQuote} closing />
          ) : null}
        </section>
      ))}
    </div>
  );
}
