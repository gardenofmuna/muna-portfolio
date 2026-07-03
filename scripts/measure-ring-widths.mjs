/**
 * Re-measure narrow ring label widths when typography changes (font, tracking, scale).
 * Run: npx playwright install chromium && node scripts/measure-ring-widths.mjs
 * Then update NARROW_LABEL_WORD_WIDTH_PX and NARROW_INTER_LABEL_GAP_PX in narrow-nav-ring.ts.
 */
import { chromium } from "playwright";

const LABELS = [
  "about",
  "design",
  "installation",
  "photos",
  "film",
  "selected works",
  "cv + press",
  "contact",
];

const NARROW_W = 859;
const NARROW_H = 1623;
const cx = NARROW_W / 2;
const cy = NARROW_H / 2;
const designR = NARROW_W / 2 + 12;
const fitScale = (NARROW_W - 44) / (2 * (designR + 70.5 * (96 / 72) * 0.42));
const r = designR * fitScale;
const fontSizePt = 70.5 * fitScale;
const tracking = -0.1;

function ringPathD(radius) {
  return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius}`;
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: NARROW_W, height: NARROW_H });

const result = await page.evaluate(
  ({ LABELS, NARROW_W, NARROW_H, cx, cy, r, fontSizePt, tracking }) => {
    const ringPathD = (radius) =>
      `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius}`;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", String(NARROW_W));
    svg.setAttribute("height", String(NARROW_H));
    const defs = document.createElementNS(NS, "defs");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("id", "p");
    path.setAttribute("d", ringPathD(r));
    defs.appendChild(path);
    svg.appendChild(defs);
    const text = document.createElementNS(NS, "text");
    text.setAttribute("font-family", '"Arial MT Std", Arial, Helvetica, sans-serif');
    text.setAttribute("font-size", `${fontSizePt}pt`);
    text.setAttribute("font-weight", "800");
    text.setAttribute("letter-spacing", `${tracking}em`);
    text.setAttribute("xml:space", "preserve");
    text.setAttribute("text-transform", "lowercase");
    const tp = document.createElementNS(NS, "textPath");
    tp.setAttribute("href", "#p");
    tp.setAttribute("xml:space", "preserve");
    for (const label of LABELS) {
      const tspan = document.createElementNS(NS, "tspan");
      tspan.textContent = label;
      tp.appendChild(tspan);
      tp.appendChild(document.createTextNode(" "));
    }
    text.appendChild(tp);
    svg.appendChild(text);
    document.body.appendChild(svg);

    const pathLength = path.getTotalLength();
    let charIndex = 0;
    const rows = [];
    let gapSum = 0;
    let gapCount = 0;
    for (let i = 0; i < LABELS.length; i++) {
      const label = LABELS[i];
      const startLen = tp.getSubStringLength(0, charIndex);
      const wordLen = tp.getSubStringLength(charIndex, label.length);
      let gapLen = 0;
      try {
        gapLen = tp.getSubStringLength(charIndex + label.length, 1);
        if (Number.isFinite(gapLen)) {
          gapSum += gapLen;
          gapCount += 1;
        }
      } catch {
        gapLen = 0;
      }
      const mid = startLen + wordLen / 2;
      const pt = path.getPointAtLength(mid);
      const center = Math.atan2(pt.y - cy, pt.x - cx);
      charIndex += label.length + 1;
      rows.push({
        label,
        wordPx: Math.round(wordLen * 100) / 100,
        gapPx: Math.round(gapLen * 100) / 100,
        pathStart: Math.round(startLen * 100) / 100,
        pathEnd: Math.round((startLen + wordLen) * 100) / 100,
        centerRad: center,
      });
    }
    const avgGap = gapCount > 0 ? gapSum / gapCount : 0;
    return {
      pathLength: Math.round(pathLength * 100) / 100,
      fullLen: Math.round((tp.getComputedTextLength?.() ?? 0) * 100) / 100,
      avgGapPx: Math.round(avgGap * 100) / 100,
      fontSizePt,
      r,
      rows,
    };
  },
  { LABELS, NARROW_W, NARROW_H, cx, cy, r, fontSizePt, tracking },
);

console.log(JSON.stringify(result, null, 2));
await browser.close();
