/**
 * Prints the white CV page (`/cv-print`) to public/Munachiso-Nzeribe-CV.pdf
 * with headless Chrome. Run with the dev server up, after editing data/cv.ts:
 *
 *   npm run cv:pdf            (uses http://localhost:3000)
 *   CV_URL=http://localhost:3001/cv-print CHROME_PATH=... npm run cv:pdf
 */
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const url = process.env.CV_URL ?? "http://localhost:3000/cv-print";
const chrome =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const out = fileURLToPath(new URL("../public/Munachiso-Nzeribe-CV.pdf", import.meta.url));

if (!existsSync(chrome)) {
  console.error(`Chrome not found at ${chrome} — set CHROME_PATH.`);
  process.exit(1);
}

execFileSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=8000",
    `--print-to-pdf=${out}`,
    url,
  ],
  { stdio: "inherit" },
);

console.log(`Wrote ${out} (${Math.round(statSync(out).size / 1024)} KB)`);
