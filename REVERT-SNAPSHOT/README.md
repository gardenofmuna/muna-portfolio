# Failsafe snapshot

This folder holds a known-good copy of `PortfolioPage.tsx` and `ArtistBioAccordion.tsx` so you can restore them if changes break the layout, hover behavior, or accordion.

**Restore page only:**

```bash
cp REVERT-SNAPSHOT/PortfolioPage.tsx components/PortfolioPage.tsx
```

**Restore full snapshot (page + accordion):**

```bash
cp REVERT-SNAPSHOT/PortfolioPage.tsx components/PortfolioPage.tsx
cp REVERT-SNAPSHOT/ArtistBioAccordion.tsx components/ArtistBioAccordion.tsx
```

**Snapshot contents (as of last update):**

- 1440×900 canvas, scale from top-left on load; scene has **overflow: visible** so accordion fold shadow can show.
- **Logo**: X=33 Y=1, scale 0.49.
- **Symbol 027** beside logo (#FF7BB5); **Symbol 068** behind logo (#F9D908, heat wave animation).
- **Polaroid + tape** grouped: position left=662, top=95; polaroid scale 0.684, rotate 12.5°; top -60; shadow rgba(0,0,0,0.32).
- **ArtistBioAccordion**: Trifold hover-to-unfold; Chrome back `artist-bio-scan-back.png`, Safari back `artist-bio-scan-back-2.png`; Safari shadow div at translateZ(-3px) with back image + box-shadow; front/back ±2px; 6px crease strips (zIndex 10) with scan texture to hide inner fold line in Safari. **Safari blur fix**: Safari renders at final size (no scale transform) to avoid blur on large displays; Chrome uses scale + `-webkit-filter: blur(0px)`.
- **"Hi! Welcome to my Portfolio!"** text: 60% scale, 3 lines, faux bold.
- **PencilCanvas**: full-screen drawing canvas; pointer-events none; draws behind data-no-draw elements.
- **CursorDot**: floating dot with spring/bounce; scales on link/button hover.
- **Intro animation**: Letter and patches (leo, toronto, lagos) start stacked at center (720, 450) with off-kilter rotations; after 2.5s delay, animate to final positions over 0.7s with rotation and translate.
- **Draggable letter** (ArtistBioAccordion) and **draggable patches** (leo, toronto, Lagos enamel pin); wiggle on hover.
- **Stickers** (stussy, mamiwata2): fixed positions, behind draggables.
- **Floating dock** (portal to `document.body` after mount): appears when pointer in bottom half; slide-up + fade-in; 2px + 3.5px scale each side; 20px below contact/cv row; dock bottom -135px.
- All seven tabs in dock with pill hover images and invisible button hit areas.
- **DockCursor**: circular shadow as cursor only when hovering a dock button; system cursor hidden then.

**Note:** The page imports `PencilCanvas`, `CursorDot`, `DockCursor`, and `ArtistBioAccordion` from `components/`—ensure those components exist. `REVERT-SNAPSHOT` is excluded from TypeScript so snapshot files are not type-checked in place.

Update this snapshot whenever you want to lock in a new "good" state (copy from `components/` into this folder).
