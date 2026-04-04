"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Catmull-Rom to Bezier: for segment p1→p2 with neighbors p0,p3.
 */
function getBezierControlPoints(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  tension = 0.5
) {
  const t = 1 - tension;
  return {
    c1: { x: p1.x + (p2.x - p0.x) * (t / 6), y: p1.y + (p2.y - p0.y) * (t / 6) },
    c2: { x: p2.x - (p3.x - p1.x) * (t / 6), y: p2.y - (p3.y - p1.y) * (t / 6) },
  };
}

function getPoint(points: { x: number; y: number }[], i: number) {
  if (i < 0) return { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y };
  if (i >= points.length) return { x: 2 * points[points.length - 1].x - points[points.length - 2].x, y: 2 * points[points.length - 1].y - points[points.length - 2].y };
  return points[i];
}

/** Evaluate Catmull-Rom curve at parameter t (0–1) over points; returns smoothed position */
function evalCatmullRom(points: { x: number; y: number }[], t: number): { x: number; y: number } {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  if (points.length === 2) {
    return { x: points[0].x + t * (points[1].x - points[0].x), y: points[0].y + t * (points[1].y - points[0].y) };
  }
  const n = points.length;
  const seg = Math.max(0, Math.min(n - 2, Math.floor(t * (n - 1))));
  const localT = (t * (n - 1)) - seg;
  const p0 = getPoint(points, seg - 1);
  const p1 = points[seg];
  const p2 = points[seg + 1];
  const p3 = getPoint(points, seg + 2);
  const { c1, c2 } = getBezierControlPoints(p0, p1, p2, p3);
  const mt = 1 - localT;
  return {
    x: mt * mt * mt * p1.x + 3 * mt * mt * localT * c1.x + 3 * mt * localT * localT * c2.x + localT * localT * localT * p2.x,
    y: mt * mt * mt * p1.y + 3 * mt * mt * localT * c1.y + 3 * mt * localT * localT * c2.y + localT * localT * localT * p2.y,
  };
}

/** Deterministic 0–1 noise for charcoal/graphite grain */
function grain(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Sample points along smooth path for brush stamping */
function samplePathPoints(points: { x: number; y: number }[], spacing = 3): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  if (points.length < 2) return out;
  if (points.length === 2) {
    const dx = points[1].x - points[0].x;
    const dy = points[1].y - points[0].y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / spacing));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      out.push({ x: points[0].x + dx * t, y: points[0].y + dy * t });
    }
    return out;
  }
  const n = points.length;
  let lastX = points[0].x;
  let lastY = points[0].y;
  out.push({ x: lastX, y: lastY });
  for (let i = 0; i < n - 1; i++) {
    const p0 = getPoint(points, i - 1);
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = getPoint(points, i + 2);
    const { c1, c2 } = getBezierControlPoints(p0, p1, p2, p3);
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y) + 1;
    const steps = Math.max(2, Math.ceil(segLen / spacing));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const mt = 1 - t;
      const x = mt * mt * mt * p1.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p2.x;
      const y = mt * mt * mt * p1.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p2.y;
      if (Math.hypot(x - lastX, y - lastY) >= spacing) {
        out.push({ x, y });
        lastX = x;
        lastY = y;
      }
    }
  }
  return out;
}

const MAX_AGE_MS = 30_000;
const TAIL_SIZE = 8; // Points in live tail that settle over time
const SETTLE_MS = 80; // Time for tail to blend from jagged → smooth
const BRUSH_SIZE = 12; // 8–14px for handwriting
const BRUSH_STEP_RATIO = 0.12; // Overlapping stamps for continuous stroke
const BRUSH_OPACITY = 0.38; // 35–40% for graphite build-up
const BRUSH_FLOW = 0.85; // 80–90% flow
const DEFAULT_COLOR = "#4A4A4A"; // Graphite fallback
const PALETTE = [
  DEFAULT_COLOR,
  "#FE5418", // Orange
  "#019F4B", // Green
  "#FF7BB5", // Pink
  "#5D639F", // Periwinkle
  "#F9D908", // Yellow
  "#804E00", // Brown
  "#373C64", // Dark Blue
];

function pickRandomColor(): string {
  if (PALETTE.length === 0) return DEFAULT_COLOR;
  return PALETTE[Math.floor(Math.random() * PALETTE.length)] ?? DEFAULT_COLOR;
}

function resolveStrokeColor(color: string | undefined): string {
  return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_COLOR;
}

type PointWithTime = { x: number; y: number; t: number };

/** Compute display path for current stroke: settled part (frozen smooth) + tail blended from raw → smooth over SETTLE_MS */
function getDisplayPath(rawPoints: PointWithTime[], now: number): { x: number; y: number }[] {
  if (rawPoints.length < 2) return rawPoints.map((p) => ({ x: p.x, y: p.y }));
  const n = rawPoints.length;
  const tailCount = Math.min(TAIL_SIZE, n);
  const settledCount = n - tailCount;
  const rawOnly = rawPoints.map((p) => ({ x: p.x, y: p.y }));
  const step = BRUSH_SIZE * BRUSH_STEP_RATIO;

  if (settledCount <= 0) {
    const tail = rawPoints.slice(-tailCount);
    const smoothed = tail.map((_, i) => evalCatmullRom(rawOnly, (i + 1) / tailCount));
    const blended = tail.map((p, i) => {
      const blend = Math.min(1, (now - p.t) / SETTLE_MS);
      return { x: p.x + (smoothed[i].x - p.x) * blend, y: p.y + (smoothed[i].y - p.y) * blend };
    });
    return blended;
  }

  const settled = samplePathPoints(rawOnly.slice(0, settledCount + 1), step);
  const tail = rawPoints.slice(-tailCount);
  const curvePoints = rawOnly.slice(Math.max(0, settledCount - 1));
  const tailSmoothed = tail.map((_, i) => evalCatmullRom(curvePoints, (i + 1) / tailCount));
  const tailBlended = tail.map((p, i) => {
    const blend = Math.min(1, (now - p.t) / SETTLE_MS);
    return { x: p.x + (tailSmoothed[i].x - p.x) * blend, y: p.y + (tailSmoothed[i].y - p.y) * blend };
  });

  return [...settled.slice(0, -1), ...tailBlended];
}

/**
 * Full-screen canvas for pencil drawing using graphite-brush.png texture.
 * Skips drawing when pointer is over [data-no-draw] (letter, dock).
 * Strokes fade out smoothly like Apple FaceTime screen share annotations.
 */
export function PencilCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<{ points: { x: number; y: number }[]; drawnAt: number; color: string }[]>([]);
  const currentStrokeRef = useRef<PointWithTime[] | null>(null);
  const currentStrokeColorRef = useRef<string>(DEFAULT_COLOR);
  const isDrawingRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [brushImages, setBrushImages] = useState<Record<string, HTMLImageElement> | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = "/graphite-brush.png";
    img.onload = () => {
      const byColor: Record<string, HTMLImageElement> = {};
      let pending = PALETTE.length;
      const checkDone = () => {
        pending--;
        if (pending <= 0) setBrushImages(Object.keys(byColor).length > 0 ? byColor : null);
      };
      if (PALETTE.length === 0) {
        setBrushImages(null);
        return;
      }
      for (const color of PALETTE) {
        try {
          const tinted = document.createElement("canvas");
          tinted.width = img.naturalWidth;
          tinted.height = img.naturalHeight;
          const tctx = tinted.getContext("2d");
          if (!tctx) {
            checkDone();
            continue;
          }
          tctx.fillStyle = color;
          tctx.fillRect(0, 0, tinted.width, tinted.height);
          tctx.globalCompositeOperation = "destination-in";
          tctx.drawImage(img, 0, 0);
          const dataUrl = tinted.toDataURL("image/png");
          const result = new Image();
          result.onload = () => {
            byColor[color] = result;
            checkDone();
          };
          result.onerror = () => checkDone();
          result.src = dataUrl;
        } catch {
          checkDone();
        }
      }
    };
    img.onerror = () => setBrushImages(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getStrokesWithFade = () => {
      const now = Date.now();
      return strokesRef.current
        .map((s) => {
          const age = now - s.drawnAt;
          const fade = Math.max(0, 1 - age / MAX_AGE_MS);
          return { ...s, fade };
        })
        .filter((s) => s.fade > 0);
    };

    const setSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const prev = sizeRef.current;
      sizeRef.current = { w, h };
      canvas.width = w;
      canvas.height = h;
      if (prev.w > 0 && prev.h > 0 && (prev.w !== w || prev.h !== h)) {
        redraw(ctx, w, h, prev.w, prev.h);
      }
    };
    setSize();
    window.addEventListener("resize", setSize);

    function redraw(
      context: CanvasRenderingContext2D,
      cw: number,
      ch: number,
      pw: number,
      ph: number
    ) {
      const scaleX = pw > 0 ? cw / pw : 1;
      const scaleY = ph > 0 ? ch / ph : 1;
      for (const { points, fade, color } of getStrokesWithFade()) {
        if (points.length < 2) continue;
        drawSmoothStroke(context, points, scaleX, scaleY, fade, resolveStrokeColor(color));
      }
    }

    function drawStroke(
      context: CanvasRenderingContext2D,
      points: { x: number; y: number }[],
      scaleX: number,
      scaleY: number,
      fade: number,
      _color: string,
      brushImg: HTMLImageElement
    ) {
      if (!brushImg?.complete || brushImg.naturalWidth === 0) return;
      const scaled = points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }));
      const step = BRUSH_SIZE * BRUSH_STEP_RATIO;
      const sampled = samplePathPoints(scaled, step);
      const hw = BRUSH_SIZE / 2;
      const baseOpacity = BRUSH_OPACITY * BRUSH_FLOW * fade;
      context.imageSmoothingEnabled = false;
      try {
        for (let i = 0; i < sampled.length; i++) {
          const pt = sampled[i];
          const pressureVariation = 0.9 + 0.1 * (grain(i * 7) * 0.5 + 0.5);
          context.globalAlpha = baseOpacity * pressureVariation;
          context.drawImage(brushImg, pt.x - hw, pt.y - hw, BRUSH_SIZE, BRUSH_SIZE);
        }
      } finally {
        context.globalAlpha = 1;
        context.imageSmoothingEnabled = true;
      }
    }

    function drawSmoothStroke(
      context: CanvasRenderingContext2D,
      points: { x: number; y: number }[],
      scaleX = 1,
      scaleY = 1,
      fade = 1,
      color = DEFAULT_COLOR
    ) {
      const brushImg = brushImages?.[color];
      if (brushImg) {
        drawStroke(context, points, scaleX, scaleY, fade, color, brushImg);
        return;
      }
      const s = (p: { x: number; y: number }) => ({ x: p.x * scaleX, y: p.y * scaleY });
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = color;
      if (points.length === 2) {
        context.globalAlpha = 0.85 * fade;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(s(points[0]).x, s(points[0]).y);
        context.lineTo(s(points[1]).x, s(points[1]).y);
        context.stroke();
      } else {
        const n = points.length;
        for (let i = 0; i < n - 1; i++) {
          const p0 = getPoint(points, i - 1);
          const p1 = points[i];
          const p2 = points[i + 1];
          const p3 = getPoint(points, i + 2);
          const { c1, c2 } = getBezierControlPoints(p0, p1, p2, p3);
          context.globalAlpha = (0.72 + 0.28 * (grain(i) * 0.5 + 0.5)) * fade;
          context.lineWidth = 1.2 + 0.9 * (grain(i * 2) * 0.5 + 0.5);
          context.beginPath();
          context.moveTo(s(p1).x, s(p1).y);
          context.bezierCurveTo(s(c1).x, s(c1).y, s(c2).x, s(c2).y, s(p2).x, s(p2).y);
          context.stroke();
        }
      }
      context.globalAlpha = 1;
    }

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as Element;
      if (target?.closest("[data-no-draw]")) return;
      isDrawingRef.current = true;
      currentStrokeColorRef.current = pickRandomColor();
      const now = Date.now();
      currentStrokeRef.current = [{ x: e.clientX, y: e.clientY, t: now }];
    };

    const redrawAll = (currentStroke: PointWithTime[] | null) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const { points, fade, color } of getStrokesWithFade()) {
        if (points.length >= 2) drawSmoothStroke(ctx, points, 1, 1, fade, resolveStrokeColor(color));
      }
      if (currentStroke && currentStroke.length >= 2) {
        const displayPath = getDisplayPath(currentStroke, Date.now());
        drawSmoothStroke(ctx, displayPath, 1, 1, 1, resolveStrokeColor(currentStrokeColorRef.current));
      }
    };

    const onMove = (e: MouseEvent) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const stroke = currentStrokeRef.current;
      const last = stroke[stroke.length - 1];
      const rawX = e.clientX;
      const rawY = e.clientY;
      if (Math.abs(rawX - last.x) < 0.5 && Math.abs(rawY - last.y) < 0.5) return;
      stroke.push({ x: rawX, y: rawY, t: Date.now() });
      redrawAll(stroke);
    };

    const onUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      if (currentStrokeRef.current && currentStrokeRef.current.length > 1) {
        const raw = currentStrokeRef.current;
        const finalized = getDisplayPath(raw, Date.now() + SETTLE_MS);
        strokesRef.current.push({
          points: finalized,
          drawnAt: Date.now(),
          color: resolveStrokeColor(currentStrokeColorRef.current),
        });
      }
      currentStrokeRef.current = null;
    };

    let rafId: number;
    const loop = () => {
      strokesRef.current = strokesRef.current.filter(
        (s) => Date.now() - s.drawnAt < MAX_AGE_MS
      );
      const hasContent = strokesRef.current.length > 0 || currentStrokeRef.current;
      if (hasContent) {
        redrawAll(currentStrokeRef.current);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    document.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", setSize);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseup", onUp);
    };
  }, [brushImages]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 200,
        pointerEvents: "none",
      }}
    />
  );
}
