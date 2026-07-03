# Layout phases

## Desktop (1440×900)

- **Design for:** Fixed 1440×900 landscape desktop (16:9-style viewport).
- **Behavior:** Static canvas; on browser resize, scale proportionally. No vertical scroll.

## Mobile / narrow (Artboard_2 — active)

- **Design for:** 859×1623 narrow artboard (phone + portrait tablet).
- **Entry:** `HomeNarrow` via `useLayoutMode()` when viewport matches narrow breakpoints.
- **Nav:** Circular SVG ring in `CircularNavWheel` with `layout="narrow"` — one rotating group + `textPath`, not desktop tab buttons.
- **In scope:** Touch drag-to-spin, tap-to-select, hub previews, spacing, and wheel interaction fixes.

Mobile/narrow work is **in active development**. Do not treat desktop-only guardrails as blocking mobile changes.
