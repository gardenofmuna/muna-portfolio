/** WebKit Safari (macOS, iOS, iPadOS) — not Chrome/Edge posing as Safari. */
export function readSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    (/Safari/.test(ua) && !/Chrome|Chromium|Edg|CriOS|FxiOS/.test(ua)) ||
    /iPhone|iPad|iPod/.test(ua)
  );
}
