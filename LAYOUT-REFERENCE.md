# Portfolio layout – KNOWN GOOD STATE (revert target)

**If things go bad, revert to this layout.** Use the spec below or restore from `REVERT-SNAPSHOT/PortfolioPage.tsx`.

---

**Canvas:** 1440×900 (`W=1440`, `H=900`). Scene is `position: absolute; top: 0; left: 0`, fixed px size, then `transform: scale(scale); transformOrigin: top left`. Scale = `Math.max(innerWidth/1440, innerHeight/900)` computed **once on load** (no resize listener). Wrapper: `position: fixed; inset: 0; overflow: hidden`.

**All positions/sizes below are relative (percentages of canvas) except welcome text.**

---

## Logo
- **Position:** `left: (41/W)*100%`, `top: (1/H)*100%`
- **Size:** `width: (183/W)*100%` only (no height; image keeps aspect via h-auto)
- **Transform:** `scale(0.7)`, `transformOrigin: top left`

---

## Polaroid
- **Position:** `left: (482/W)*100%`, `top: (80/H)*100%`
- **Size:** `width: (499/W)*100%` only (no height; image keeps aspect)
- **Transform:** `scale(0.8) rotate(105.58deg)`, `transformOrigin: center center`
- **Drop shadow:** `boxShadow: "3px -1px 8px 0 rgba(0,0,0,0.44)"` (flipped from Photoshop 162°)

---

## Tape
- **Position:** `left: (644/W)*100%`, `top: (45/H)*100%`
- **Size:** `width: (312/W)*100%` only (no height; image keeps aspect)
- **Transform:** `scale(0.8) rotate(13.40deg)`, `transformOrigin: center center`

---

## Welcome text (“Hi! Welcome to my Portfolio!”)
- **Position:** fixed px `left: 963`, `top: 292`
- **Color:** `#1b141b`
- **Font:** Biro Script (font-handwritten), `fontSize: 86.7px`, `lineHeight: 1.2`
- **Transform:** `scale(0.6)`, `transformOrigin: top left`
- **Layout:** flex column, 3 lines (each span `display: block`, `whiteSpace: nowrap`): Hi! / Welcome to / my Portfolio!
- **Faux bold:** `textShadow` with `#1b141b` (0.5px offsets)

---

## Tab area
- **Moved up 126px:** original top was 587 → now **461** (`TAB_AREA_TOP = 461`, `TAB_AREA_HEIGHT = H - 461`).
- **Position:** `left: 50%`, `transform: translateX(-50%)`, `top: (TAB_AREA_TOP/H)*100%`
- **Size:** `width: 100.56%`, `height: (TAB_AREA_HEIGHT/H)*100%`
- **Overflow:** hidden

**Issue when moving up 126px:** If we position content with `(tab.y - TAB_AREA_TOP)` inside the new container, the rows sit too low (container got taller but content stayed at absolute y 713,777,840). **Fix:** Use a content origin **587** so the first row stays 126px below the container top: `TAB_CONTENT_ORIGIN_Y = 587`. Position shapes and text with `(tab.y - TAB_CONTENT_ORIGIN_Y)` and `(t.y - TAB_CONTENT_ORIGIN_Y)`.

### Tab shapes (TAB_SHAPES)
- Each wrapper: `left: 0`, `top: ((tab.y - TAB_CONTENT_ORIGIN_Y)/TAB_AREA_HEIGHT)*100%`, `width: 100%`, `height: (tab.h/TAB_AREA_HEIGHT)*100%`
- SVG content: `object-cover object-top`, fill wrapper
- **Tab text pinned to shape:** each TAB_TEXTS entry has `svg` (e.g. `/6.svg`); labels are rendered *inside* the matching shape div so text moves with the tab. Position within shape: `left: ((t.x+2)/1448)*100%`, `top: ((t.y - tab.y)/tab.h)*100%`, `transform: translateY(-50%)`

### Tab text (TAB_TEXTS)
- **Colors:** `#1b141b` (graphic design, interactive + installation, photos, film, selected works), `#f4efea` (cv + press, contact)
- **Font:** Arial MT Std (Extra Bold), `fontSize: 39.8px`, `letterSpacing: -0.04em`
- **x positions:** graphic design 59, interactive + installation 763, photos 60, film 555, selected works 1000, cv + press 59, contact 764

---

*To restore: reapply these formulas in `components/PortfolioPage.tsx` and keep scale-once, top-left origin, and the constants W, H, TAB_AREA_TOP, TAB_AREA_HEIGHT, TAB_CONTENT_ORIGIN_Y, TAB_SHAPES, TAB_TEXTS. Or copy the file from `REVERT-SNAPSHOT/PortfolioPage.tsx` over `components/PortfolioPage.tsx`.*
