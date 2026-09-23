#!/usr/bin/env node
/**
 * Installation media recipe (sharp + smooth on Safari/Chrome):
 *
 * 1. Encode once for screen size (~2× CSS width), high-quality WebP.
 * 2. Serve those files as-is (`unoptimized`) — never re-compress in Next.
 * 3. Animated path (carousel / FLIP / heroes) uses the same files everywhere.
 *
 * Targets:
 *   hero / carousel     → long edge 1440, q 90
 *   full-width collage  → long edge 1920, q 92
 *   3-up gallery cells  → long edge 1600, q 92
 *
 * Usage:
 *   npm run encode:installation
 *
 * Expects masters in ~/Downloads (paths below). Edit JOBS if yours move.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DL = join(homedir(), "Downloads");
const AK = join(DL, "AKUABATA - NKIRUKA");
const OG = join(DL, "OGUTA-LAGOS-TORONTO");

const Q_HERO = 90;
const Q_BODY = 92;

/** @type {{ src: string; dest: string; max: number; q: number }[]} */
const JOBS = [
  // Carousel / FLIP heroes (shared desktop + mobile)
  {
    src: join(DL, "MAMAINYOURABSENCE.png"),
    dest: "public/MAMAINYOURABSENCE.webp",
    max: 1440,
    q: Q_HERO,
  },
  {
    src: join(DL, "OGUTA-LAGOS-TORONTO-2025.png"),
    dest: "public/OGUTA-LAGOS-TORONTO-2025.webp",
    max: 1440,
    q: Q_HERO,
  },
  {
    src: "__AKU_HERO__",
    dest: "public/Akuabata-Nkiruka.webp",
    max: 1440,
    q: Q_HERO,
  },

  // OGUTA case study
  { src: join(OG, "1.png"), dest: "public/installation/oguta/gallery-1.webp", max: 1600, q: Q_BODY },
  { src: join(OG, "2.png"), dest: "public/installation/oguta/gallery-2.webp", max: 1600, q: Q_BODY },
  { src: join(OG, "3.jpeg"), dest: "public/installation/oguta/gallery-3.webp", max: 1600, q: Q_BODY },
  { src: join(OG, "4.png"), dest: "public/installation/oguta/collage-large.webp", max: 1920, q: Q_BODY },
  { src: join(OG, "5.webp"), dest: "public/installation/oguta/frames-detail.webp", max: 1920, q: Q_BODY },

  // Akuabata case study
  {
    src: join(AK, "0EF82926-DAAA-4A3D-AF11-448591B71904.JPG"),
    dest: "public/installation/akuabata/gallery-corner.webp",
    max: 1600,
    q: Q_BODY,
  },
  {
    src: join(AK, "IMG_0238 3.jpg"),
    dest: "public/installation/akuabata/gallery-person.webp",
    max: 1600,
    q: Q_BODY,
  },
  {
    src: join(AK, "96BD0D73-0A8E-43D8-9E23-A71B645E0873.jpg"),
    dest: "public/installation/akuabata/gallery-frames.webp",
    max: 1600,
    q: Q_BODY,
  },
  {
    src: join(AK, "IMG_0222.PNG.webp"),
    dest: "public/installation/akuabata/collage-large.webp",
    max: 1920,
    q: Q_BODY,
  },
  {
    src: join(AK, "Onyemaechi-Munachiso-Nzeribe-1.jpg"),
    dest: "public/installation/akuabata/onyemaechi-still.webp",
    max: 1920,
    q: Q_BODY,
  },
];

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")}\n${r.stderr || r.stdout}`);
  }
  return r.stdout.trim();
}

function resolveAkuHero() {
  const preferred = join(DL, "Akuabata-Nkiruka.png");
  if (existsSync(preferred)) return preferred;
  const r = spawnSync(
    "git",
    ["show", "4aa0e82:public/Akuabata-Nkiruka.png"],
    { cwd: ROOT, encoding: "buffer", maxBuffer: 20 * 1024 * 1024 },
  );
  if (r.status === 0 && r.stdout?.length) {
    const tmp = join("/tmp", "aku-hero.png");
    writeFileSync(tmp, r.stdout);
    return tmp;
  }
  return null;
}

function encode(src, destAbs, max, q) {
  mkdirSync(dirname(destAbs), { recursive: true });
  const vf = `scale='min(${max},iw)':'min(${max},ih)':force_original_aspect_ratio=decrease`;
  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    src,
    "-vf",
    vf,
    "-c:v",
    "libwebp",
    "-q:v",
    String(q),
    "-compression_level",
    "4",
    destAbs,
  ]);
  const dims = run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=p=0:s=x",
    destAbs,
  ]);
  const bytes = run("stat", ["-f", "%z", destAbs]);
  const kb = Math.round(Number(bytes) / 1024);
  console.log(`  ${dims}  ${kb}KB  → ${destAbs.replace(ROOT + "/", "")}`);
  return dims;
}

function main() {
  console.log("Encoding installation WebPs (display-sized, high quality)…\n");
  const akuHero = resolveAkuHero();
  let failed = 0;

  for (const job of JOBS) {
    let src = job.src;
    if (src === "__AKU_HERO__") {
      if (!akuHero) {
        console.warn("SKIP public/Akuabata-Nkiruka.webp — no hero master");
        failed++;
        continue;
      }
      src = akuHero;
    }
    if (!existsSync(src)) {
      console.warn(`SKIP missing source: ${src}`);
      failed++;
      continue;
    }
    try {
      encode(src, join(ROOT, job.dest), job.max, job.q);
    } catch (e) {
      console.error(`FAIL ${job.dest}:`, e instanceof Error ? e.message : e);
      failed++;
    }
  }

  console.log(
    failed
      ? `\nDone with ${failed} skip/fail(s). Update JOBS sources if needed.`
      : "\nDone. Keep `unoptimized` on carousel + case-study Images so Next does not re-crush these.",
  );
  if (failed) process.exitCode = 1;
}

main();
