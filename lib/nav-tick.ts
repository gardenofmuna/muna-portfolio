"use client";

/**
 * Dial tick for the circular nav — short mechanical click + light haptic.
 * Pattern mirrors common “ruler nav” sites: one Web Audio one-shot per step,
 * gain > 1 because the WAV itself is quiet; vibrate where the browser allows.
 */

const TICK_SRC = "/tick.wav";
/** Quiet sample; gain matches the feel of a hard UI click. */
/** Same boost as the reference nav (quiet WAV + gain 8). */
const TICK_GAIN = 8;
const VIBRATE_MS = 8;
/** Minimum spacing so a fast flick doesn’t smear into noise. */
const MIN_INTERVAL_MS = 18;

type TickState = {
  ctx: AudioContext | null;
  buffer: AudioBuffer | null;
  load: Promise<AudioBuffer | null> | null;
  unlocked: boolean;
  nextAt: number;
  lastPlay: number;
};

const state: TickState = {
  ctx: null,
  buffer: null,
  load: null,
  unlocked: false,
  nextAt: 0,
  lastPlay: 0,
};

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (state.ctx && state.ctx.state !== "closed") return state.ctx;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  try {
    state.ctx = new AC({ latencyHint: "interactive" });
  } catch {
    try {
      state.ctx = new AC();
    } catch {
      state.ctx = null;
      return null;
    }
  }
  return state.ctx;
}

function loadBuffer(): Promise<AudioBuffer | null> {
  if (state.buffer) return Promise.resolve(state.buffer);
  if (state.load) return state.load;
  const ctx = ensureCtx();
  if (!ctx) return Promise.resolve(null);
  state.load = fetch(TICK_SRC)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((raw) => {
      if (!raw || !state.ctx || state.ctx.state === "closed") return null;
      return state.ctx.decodeAudioData(raw.slice(0));
    })
    .then((buf) => {
      if (buf) state.buffer = buf;
      return buf;
    })
    .catch(() => null)
    .finally(() => {
      state.load = null;
    });
  return state.load;
}

function resumeCtx(force = false): void {
  const ctx = state.ctx;
  if (!ctx || ctx.state === "closed") return;
  if (ctx.state === "running") return;
  if (
    !force &&
    typeof navigator !== "undefined" &&
    navigator.userActivation &&
    !navigator.userActivation.isActive
  ) {
    return;
  }
  void ctx.resume().catch(() => {});
}

function fireHaptic(): void {
  try {
    navigator.vibrate?.(VIBRATE_MS);
  } catch {
    /* unsupported */
  }
}

function startSource(buf: AudioBuffer, gainValue: number): boolean {
  const ctx = state.ctx;
  if (!ctx || ctx.state !== "running") return false;
  try {
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.value = gainValue;
    src.connect(gain).connect(ctx.destination);
    const t = Math.max(ctx.currentTime, state.nextAt);
    src.start(t);
    state.nextAt = t + 0.012;
    src.onended = () => {
      try {
        src.disconnect();
        gain.disconnect();
      } catch {
        /* noop */
      }
    };
    return true;
  } catch {
    return false;
  }
}

/** Call from the first pointerdown on the wheel so iOS unlocks audio. */
export function unlockNavTick(): void {
  const ctx = ensureCtx();
  if (!ctx) return;
  state.unlocked = true;
  void loadBuffer();
  resumeCtx(true);
  /* Silent prime — some mobile browsers stay muted until a real start(). */
  try {
    const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = silent;
    src.connect(ctx.destination);
    src.start();
    src.onended = () => {
      try {
        src.disconnect();
      } catch {
        /* noop */
      }
    };
  } catch {
    /* noop */
  }
}

/** One click + haptic for a dial step. Safe to call every frame; rate-limited. */
export function playNavTick(): void {
  const now = performance.now();
  if (now - state.lastPlay < MIN_INTERVAL_MS) return;
  state.lastPlay = now;

  fireHaptic();

  const ctx = ensureCtx();
  if (!ctx) return;
  if (!state.unlocked) {
    /* Still try after a gesture may have happened elsewhere this tick. */
    state.unlocked = true;
  }
  resumeCtx(true);
  void loadBuffer().then((buf) => {
    if (!buf) return;
    if (state.ctx?.state !== "running") {
      resumeCtx(true);
      window.setTimeout(() => {
        if (state.buffer) startSource(state.buffer, TICK_GAIN);
      }, 0);
      return;
    }
    startSource(buf, TICK_GAIN);
  });
}
