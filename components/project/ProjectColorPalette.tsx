"use client";

import { useEffect, useState, type CSSProperties } from "react";

export type PaletteSwatch = {
  id: string;
  name: string;
  /** When set, shows “Primary/Secondary” + “Color Palette” above the name. */
  group?: "Primary" | "Secondary";
  hex: string;
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

const CYCLE_MS = 1400;
const INK_WHITE = "#ffffff";
const INK_GREY = "#6e6e6e";

type Props = {
  swatches: readonly PaletteSwatch[];
  ariaLabel: string;
  /** Prefix for option ids (unique per page). */
  idPrefix: string;
  /**
   * Swatch ids that use grey ink (e.g. EGWÚ cream).
   * All other labels are white. Omit / empty → all white.
   */
  darkInkIds?: readonly string[];
};

/**
 * Interactive expanding color bars — shared by EGWÚ and DOC NOW.
 */
export function ProjectColorPalette({
  swatches,
  ariaLabel,
  idPrefix,
  darkInkIds = [],
}: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeSwatch = swatches[active] ?? swatches[0]!;
  const darkInk = new Set(darkInkIds);

  useEffect(() => {
    if (paused || swatches.length === 0) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % swatches.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, swatches.length]);

  return (
    <figure
      className="project-asset-single project-asset-single--colors project-egwu-colors"
      style={
        {
          ["--egwu-bar-count"]: String(swatches.length),
        } as CSSProperties
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="project-egwu-colors__card" aria-label={ariaLabel}>
        <div
          className="project-egwu-colors__bars"
          role="listbox"
          aria-label="Color swatches"
          aria-activedescendant={`${idPrefix}-${activeSwatch.id}`}
        >
          {swatches.map((s, i) => {
            const selected = i === active;
            const rgb = hexToRgb(s.hex);
            const ink = darkInk.has(s.id) ? INK_GREY : INK_WHITE;
            return (
              <button
                key={s.id}
                id={`${idPrefix}-${s.id}`}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={`${s.group ? `${s.group}: ` : ""}${s.name} ${s.hex}`}
                className={`project-egwu-colors__bar${
                  selected ? " is-active" : ""
                }`}
                style={{ backgroundColor: s.hex, color: ink }}
                onClick={() => {
                  setActive(i);
                  setPaused(true);
                }}
              >
                <span
                  className="project-egwu-colors__meta"
                  aria-hidden={!selected}
                >
                  <span className="project-egwu-colors__meta-block project-egwu-colors__meta-block--name">
                    {s.group ? (
                      <span className="project-egwu-colors__group">
                        <span className="project-egwu-colors__group-kind">
                          {s.group}
                        </span>
                        <span className="project-egwu-colors__group-label">
                          Color Palette
                        </span>
                      </span>
                    ) : null}
                    <span className="project-egwu-colors__name">{s.name}</span>
                  </span>
                  <span className="project-egwu-colors__meta-block">
                    <span className="project-egwu-colors__label">HEX</span>
                    <span className="project-egwu-colors__value">{s.hex}</span>
                  </span>
                  <span className="project-egwu-colors__meta-block project-egwu-colors__meta-block--rgb">
                    <span className="project-egwu-colors__channel">
                      <span>R</span> {rgb.r}
                    </span>
                    <span className="project-egwu-colors__channel">
                      <span>G</span> {rgb.g}
                    </span>
                    <span className="project-egwu-colors__channel">
                      <span>B</span> {rgb.b}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
