# Mobile wheel architecture

Artboard_2 (859×1623) circular nav — `layout="narrow"` on `CircularNavWheel`.  
This documents the **final working system** as of the production cleanup pass.

## Key files

| File | Role |
|------|------|
| `components/HomeNarrow.tsx` | Mounts wheel, wires hub previews |
| `components/CircularNavWheel.tsx` | Rotation, pointer input, snap, render |
| `lib/narrow-nav-ring.ts` | Label arcs, snap math, hit overlays, Safari measure |
| `lib/narrow-stage.ts` | Artboard constants (hub, radius, font, band) |
| `scripts/measure-ring-widths.mjs` | Regenerate baked word widths after typography changes |

---

## Component hierarchy

```
HomeNarrow
└─ NarrowArtboard (859×1623, scaled to viewport)
   ├─ SiteWordmark
   ├─ MobileFooterLinks
   ├─ CircularNavWheel layout="narrow"
   │  └─ wrapRef (pointer capture, touchAction: none)
   │     └─ rotator div — single CSS rotate(φ) at NARROW_WHEEL_CENTER
   │        ├─ SVG textPath ring (visual only, pointer-events: none)
   │        └─ invisible tangent hit buttons [data-narrow-nav-hit]
   ├─ DesignCluster / InstallationLottie / PhotosHoverCluster (hub previews)
   └─ NarrowCenterPopup → AboutBio (about + contact)
```

**Critical invariant:** SVG labels and hit buttons are **children of one rotator**. Hit overlays are authored at rotation 0; the parent `transform: rotate(...)` turns both together. Do not rotate hitboxes independently.

---

## State flow

### Inside `CircularNavWheel` (narrow)

| State | Purpose |
|-------|---------|
| `rotation` | Wheel angle φ (rad). Drives rotator CSS `rotate(deg)`. |
| `focusedIndex` | Selected section (0–7). Fires `onActiveLabelChange`. |
| `hoveredIndex` | Live preview at 12 o'clock while dragging (`syncNarrowTopHover`). |
| `isDragging` | Finger/mouse is spinning the wheel. |
| `isSnapping` | CSS transition active on rotator (animated settle). |
| `narrowSnapActive` | Full snap pipeline running; controls active-label rendering (no fill ghosting). |
| `hitOverlays` | Cached rects from `narrowHitOverlayRects()`. |
| `ringLayout` | From `useNarrowRingLayout()` — `labelAngles`, `labelArcs`, `radius`, `ready`. |

Refs mirror state for pointer handlers and effects (`rotationRef`, `focusedRef`, `labelAnglesRef`, `labelArcsRef`, etc.) to avoid stale closures.

### In `HomeNarrow`

| State | Source |
|-------|--------|
| `activeLabel` | `onActiveLabelChange` — committed selection |
| `hoverNavLabel` | `onHoverLabelChange` — label at 12 o'clock while dragging |
| `wheelInteracting` | `onWheelInteractingChange` — drag in progress |

Hub preview uses `previewLabel = wheelInteracting && hoverNavLabel ? hoverNavLabel : activeLabel`.

### Active label styling (narrow SVG)

```text
narrowHotIndex =
  hoveredIndex ?? (narrowSnapActive ? narrowIndexAtTop(rotation) : focusedIndex)
```

During snap, the hot label follows **who is at 12 o'clock**, not `focusedIndex` alone. Fill transition is disabled while `narrowSnapActive` to prevent tap ghosting.

---

## Rotation math

- **Hub:** `NARROW_WHEEL_CENTER` = artboard centre `(429.5, 811.5)`.
- **Ring radius:** `NARROW_WHEEL_R` (scaled to fit artboard width).
- **Live rotation φ:** applied once on the rotator: `transform: rotate(φ_deg)` at hub origin.
- **Drag:** `atan2(p.y - hubY, p.x - hubX)` deltas on each move; unwrap Δ across ±π.
- **Pointer coords (narrow):** screen → artboard via `wrapRef` bounding rect × `NARROW_W/H`.

### Snap target for label `i`

From `narrowSnapRotation(i, labelAngles, current)`:

```text
θᵢ = labelAngles[i]           // label centre on ring at φ=0
target = -π/2 - θᵢ            // rotation that puts label at 12 o'clock
return target + k·2π          // k chosen so result is closest to current
```

`narrowIndexAtTop(φ)` picks the label whose snap target is nearest to current φ (used on drag release and during snap styling).

---

## Deterministic label arc generation

**Source of truth:** `buildDeterministicNarrowLabelArcs()` in `narrow-nav-ring.ts`.

1. Baked per-word path widths: `NARROW_LABEL_WORD_WIDTH_PX` (Chromium-measured).
2. Fixed inter-label gap: `NARROW_INTER_LABEL_GAP_PX`.
3. Cumulative layout along ring path → each label gets `pathStart`, `pathEnd`, `center` (angle).

Scales uniformly if `pathLength ≠` reference length.

**Regenerate widths after font/tracking/scale changes:**

```bash
npx playwright install chromium && node scripts/measure-ring-widths.mjs
```

Update `NARROW_LABEL_WORD_WIDTH_PX`, `NARROW_INTER_LABEL_GAP_PX`, and `NARROW_RING_LAYOUT_REF_PATH_LENGTH` in `narrow-nav-ring.ts`.

**Runtime layout:** `useNarrowRingLayout(true)` → `staticRingLayout()` immediately, then `measureNarrowRingLayout()` after fonts load (may replace arcs with DOM measure on capable browsers).

`NARROW_BAKED_LABEL_ANGLES` = centres from deterministic layout at default radius (used for initial rotation).

---

## Tangent-oriented hitbox generation

`narrowHitOverlayRects(rotation, labelArcs, cx, cy, radius, bandPx)` — one rect per label.

| Property | How it's computed |
|----------|-------------------|
| **Centre** | Ring point at `arc.center`, shifted **+8px outward** (`HIT_RADIAL_OUTSET_PX`) along radial — sits on glyphs, not baseline |
| **Width** | `pathEnd - pathStart + 20px` tangent padding (`padEnd = 10` each side) |
| **Height** | `bandPx × 1.35` (`HIT_PERP_SCALE`) — caps + descenders |
| **Orientation** | `rotate(angleRad + 90°)` — width along tangent, height across glyph band |

Buttons: `opacity: 0`, `data-narrow-nav-hit={index}`, `pointer-events: auto` only when `hitOverlaysActive` (not dragging, not snapping, layout ready).

Overlays recomputed in `useLayoutEffect` after `labelArcs` change (double rAF for settled DOM).

---

## Snapping pipeline

`selectNarrowIndex(i)` → clears hover, sets `focusedIndex`, calls `snapNarrowToIndex(i)`.

**`snapNarrowToIndex` (three phases):**

1. **Instant base snap** — `setIsSnapping(false)`, jump rotation to `narrowSnapRotation(i)`. No CSS transition (DOM must match state before measure).
2. **Visual correction** — after 2× `requestAnimationFrame`, `narrowVisualSnapDelta(i, wrapRef)` reads focused tspan bbox vs hub; adds small Δ if `|Δ| ≥ 0.0004`.
3. **Animated settle** — `setIsSnapping(true)`, apply `baseSnap + Δ`, CSS transition `380ms` (`NARROW_SNAP_MS`). `narrowSnapActive` cleared when timeout fires.

**Cancellation:** `snapGenerationRef` bumps on each new snap; stale rAF/timeouts are ignored.

**Layout re-snap:** `useLayoutEffect` keyed on `layoutSnapKey` (`isNarrow:ready:labelArcsVersion`) — never pass `labelArcs` array directly as a dep (HMR deps-size bug). `layoutSnappedKeyRef` prevents duplicate snaps.

---

## Touch vs mouse

Both select on **`pointerdown`** via `selectNarrowIndex` — not on `pointerup`.

| | Touch | Mouse |
|---|-------|-------|
| **Hit detection** | `e.target.closest("[data-narrow-nav-hit]")` | `narrowHitIndexAtPoint()` — walks `elementsFromPoint` stack |
| **Why different** | Large contact pad hits button directly | 1px cursor can miss `e.target` at box edge; stack walk finds full transformed hitbox |
| **After select** | `pointerup` releases capture only | Same |
| **Tap → drag** | Movement > `TAP_MOVE_PX` (8px) converts pending hit to drag | Same |
| **Drag release** | `finishNarrowSpin()` → `narrowIndexAtTop` → snap | Same |

SVG text has `pointer-events: none`. All narrow input goes through hit buttons or wrap-level drag.

---

## Safari fallback

On mount, `measureNarrowRingLayout()` tries `getSubStringLength` per tspan via off-screen SVG (`measureLabelArcsFromTextPath`).

If `labelArcsAreUsable()` fails (collapsed spans, clustered centres, non-monotonic path distances), layout falls back to **`buildDeterministicNarrowLabelArcs()`** — same geometry used for hitboxes and snap on Chromium.

SSR / no `document`: returns `staticRingLayout()` (deterministic only).

---

## Debug flags

**None remain** in production code. All `DEBUG_*` flags, console logging, and red hitbox outlines were removed in the cleanup pass.

To temporarily visualize hitboxes again, add a local flag in `CircularNavWheel.tsx` hit button styles only — do not commit.

---

## Known invariants

1. **One rotator** — single `rotate` on parent div; SVG + hits are siblings inside it.
2. **One layout model** — `labelArcs` drives SVG ring spacing, hitbox spans, and snap angles.
3. **12 o'clock selection** — active/hover preview and drag-release all use `narrowIndexAtTop` / `narrowSnapRotation` toward `-π/2`.
4. **Hit overlays at rotation 0** — never bake wheel φ into overlay positions; parent turns them.
5. **Snap before measure** — base snap is instant (`isSnapping: false`); transition only on final corrected angle.
6. **Label IDs** — `circular-nav-item-{i}` required for `narrowVisualSnapDelta` DOM read.
7. **Artboard coords** — all geometry in 859×1623 space; viewport scaling is `NarrowArtboard`'s job.

---

## Do not change casually

| Area | Risk if changed |
|------|-----------------|
| `snapNarrowToIndex` two-phase snap + `snapGenerationRef` | Visual offset bug returns (~6° off 12 o'clock); stale snaps clobber rotation |
| `layoutSnapKey` / `layoutSnappedKeyRef` | HMR crash or redundant layout snaps |
| `narrowSnapActive` + `narrowHotIndex` | Tap ghosting / double-active labels |
| `HIT_RADIAL_OUTSET_PX`, `HIT_PERP_SCALE`, `padEnd` | Hit coverage vs word glyphs — retune with debug outlines, not guesswork |
| `NARROW_LABEL_WORD_WIDTH_PX` without running measure script | Misaligned hits, snaps, and visuals |
| `labelArcsAreUsable()` thresholds | iOS may use broken measured arcs instead of deterministic fallback |
| `narrowVisualSnapDelta` | Geometric snap correct but label visually off-centre at hub |
| Mouse `elementsFromPoint` vs touch `closest` | Breaks one input modality |
| `TAP_MOVE_PX`, `NARROW_SNAP_MS` | Tap/drag discrimination and settle timing |
| Moving hitboxes outside rotator | Transformed hitboxes won't track wheel rotation |

---

## Constants (quick reference)

| Constant | Value | Location |
|----------|-------|----------|
| `TAP_MOVE_PX` | 8 | `CircularNavWheel.tsx` |
| `NARROW_SNAP_MS` | 380 | `CircularNavWheel.tsx` |
| `HIT_RADIAL_OUTSET_PX` | 8 | `narrow-nav-ring.ts` |
| `HIT_PERP_SCALE` | 1.35 | `narrow-nav-ring.ts` |
| `padEnd` | 10 | `narrow-nav-ring.ts` |

---

## What we tried and removed

Short list of abandoned approaches — do not resurrect without re-reading why they failed:

- **SVG tspan pointer-events / `elementFromPoint` on glyphs** — unreliable for mouse; tiny targets, wrong stack order.
- **Angular wedge tap detection** (`narrowIndexFromRingTap`, pointer angle math) — replaced by tangent HTML hit buttons sharing rotator transform.
- **Snap on `pointerup` for mouse** — race with drag; unified to snap-on-`pointerdown` for touch and mouse.
- **Rotating SVG `<g>` instead of wrapper div** — hit overlays and ring got out of sync; single rotator div won.
- **Hand-tuned `NARROW_BAKED_LABEL_ANGLES`** — replaced by cumulative word-width layout; one model for ring, hits, snap.
- **Debug logging / red hitbox overlays** — removed after QA; use temporary local flag if needed again.
- **Spin momentum / `narrowIndexFromPointer`** — not in final build; drag release uses direct `narrowIndexAtTop` snap only.

---

## Related comment blocks

Shorter inline docs also live at the top of:

- `components/CircularNavWheel.tsx`
- `lib/narrow-nav-ring.ts`

Read those first when opening the files; this doc is the full picture.
