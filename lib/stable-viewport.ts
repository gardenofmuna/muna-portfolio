/**
 * Stable layout size for the artboard.
 *
 * On iPhone / iPad, Safari’s URL bar and keyboard shrink visualViewport and
 * would rescale the stage — we lock height within an orientation so chrome
 * can overlay without reflow.
 *
 * On desktop (mouse / trackpad), always follow the live window size so
 * resizing never leaves a stale locked frame until refresh.
 */

let lockedW = 0;
let lockedH = 0;
let lockedOrient = "";

/*
 * A page that scrolls the document lets Safari collapse its toolbar, which
 * grows innerHeight. Keep the lock as it was until shortly after that page
 * closes, so the landing comes back at the size it was laid out for.
 */
const HOLD_GRACE_MS = 800;
let holds = 0;
let heldUntil = 0;

export function holdStableLayout(): () => void {
  holds += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds -= 1;
    heldUntil = performance.now() + HOLD_GRACE_MS;
  };
}

function layoutHeld() {
  return holds > 0 || performance.now() < heldUntil;
}

function orientationKey(width: number, height: number) {
  const type = window.screen?.orientation?.type;
  if (type) return type;
  return width >= height ? "landscape" : "portrait";
}

/** True when browser chrome commonly resizes the visual viewport. */
function shouldLockForBrowserChrome() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod/i.test(ua)) return true;
  /* iPadOS 13+ reports as MacIntel with touch points. */
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return true;
  }
  if (/iPad/i.test(ua)) return true;
  if (/Android/i.test(ua) && navigator.maxTouchPoints > 0) return true;
  return false;
}

function rawLayoutSize() {
  const doc = document.documentElement;
  /* Prefer layout viewport — more stable than visualViewport on iOS. */
  const width = Math.max(doc.clientWidth || 0, window.innerWidth || 0);
  const height = Math.max(
    doc.clientHeight || 0,
    window.innerHeight || 0,
  );
  return { width, height };
}

/** Width/height for stage + narrow artboard scaling. */
export function readStableLayoutSize(): { width: number; height: number } {
  const { width, height } = rawLayoutSize();
  if (width < 2 || height < 2) return { width, height };

  /* Desktop window drag — always track live size (no lock lag). */
  if (!shouldLockForBrowserChrome()) {
    lockedW = width;
    lockedH = height;
    lockedOrient = orientationKey(width, height);
    return { width, height };
  }

  const orient = orientationKey(width, height);
  if (lockedW && orient === lockedOrient && layoutHeld()) {
    return { width: lockedW, height: lockedH };
  }
  const widthJump = Math.abs(width - lockedW) > 48;
  const heightJump = Math.abs(height - lockedH) > 140;

  if (!lockedW || orient !== lockedOrient || widthJump || heightJump) {
    lockedOrient = orient;
    lockedW = width;
    lockedH = height;
    return { width: lockedW, height: lockedH };
  }

  lockedW = width;
  /* Same orientation, small height drop = URL bar / keyboard — keep larger. */
  lockedH = Math.max(lockedH, height);
  return { width: lockedW, height: lockedH };
}

/** Reset after orientationchange so the next read re-locks cleanly. */
export function resetStableLayoutSize() {
  lockedW = 0;
  lockedH = 0;
  lockedOrient = "";
}

/**
 * Subscribe to layout-affecting resizes.
 * Mobile: ignore visualViewport chrome flicker.
 * Desktop: window.resize is enough and stays live.
 */
export function subscribeStableLayout(onChange: () => void) {
  const onOrient = () => {
    resetStableLayoutSize();
    onChange();
    window.setTimeout(onChange, 120);
    window.setTimeout(onChange, 320);
  };
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onOrient);
  window.addEventListener("pageshow", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onOrient);
    window.removeEventListener("pageshow", onChange);
  };
}
