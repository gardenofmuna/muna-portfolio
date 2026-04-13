"use client";

import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

type Props = {
  visible: boolean;
};

/** Visual size vs prior baseline (0.9 = 10% smaller). */
const LOTTIE_DISPLAY_SCALE = 0.9;
/** Pixels of cursor travel → one frame of the animation (tune feel). */
const FRAME_SENSITIVITY = 0.42;
/** Horizontal drag drives forward/back; small vertical blend for diagonal moves. */
const MOVE_X = 1;
const MOVE_Y = 0.35;

function lastFrameIndex(api: LottieRefCurrentProps): number | null {
  const dur = api.getDuration(true);
  if (dur === undefined || dur < 1) return null;
  return Math.max(0, dur - 1);
}

/**
 * Lottie beside the circular nav arc when “installation” is active.
 * Playback is driven only by pointer *movement*: moving right advances, left rewinds.
 */
export function InstallationLottie({ visible }: Props) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  /** Current playhead (frames); only changes when the pointer moves. */
  const frameRef = useRef(0);
  const flushRafRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduceMotion(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
    if (!visible || animationData || loadError) return;
    let cancelled = false;
    fetch("/work-animation.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, animationData, loadError]);

  /** Pointer movement is the only driver: delta → forward / backward along the timeline. */
  useEffect(() => {
    if (!visible || reduceMotion) {
      return;
    }

    const flush = () => {
      flushRafRef.current = null;
      const api = lottieRef.current;
      if (!api?.animationLoaded) return;
      const dur = api.getDuration(true);
      if (dur === undefined || dur < 1) return;
      const maxF = Math.max(0, dur - 1);
      frameRef.current = Math.max(0, Math.min(maxF, frameRef.current));
      api.goToAndStop(Math.round(frameRef.current), true);
    };

    const onMove = (e: PointerEvent) => {
      const api = lottieRef.current;
      if (!api?.animationLoaded) return;
      const dur = api.getDuration(true);
      if (dur === undefined || dur < 1) return;
      const maxF = Math.max(0, dur - 1);

      /* movementX/Y: how far the pointer moved since last event — sign = direction */
      const delta = e.movementX * MOVE_X + e.movementY * MOVE_Y;
      frameRef.current += delta * FRAME_SENSITIVITY;
      frameRef.current = Math.max(0, Math.min(maxF, frameRef.current));

      if (flushRafRef.current != null) return;
      flushRafRef.current = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (flushRafRef.current != null) {
        cancelAnimationFrame(flushRafRef.current);
        flushRafRef.current = null;
      }
    };
  }, [visible, reduceMotion]);

  /** Start on the last frame once the Lottie instance is ready. */
  useEffect(() => {
    if (!visible || reduceMotion || !animationData) return;
    let n = 0;
    const tick = () => {
      const api = lottieRef.current;
      if (!api?.animationLoaded && n++ < 50) {
        requestAnimationFrame(tick);
        return;
      }
      if (api?.animationLoaded) {
        const last = lastFrameIndex(api);
        if (last !== null) {
          frameRef.current = last;
          api.goToAndStop(last, true);
        }
      }
    };
    requestAnimationFrame(tick);
  }, [visible, reduceMotion, animationData]);

  useEffect(() => {
    const api = lottieRef.current;
    if (!api) return;
    if (reduceMotion) {
      api.pause();
      const last = lastFrameIndex(api);
      if (last !== null) api.goToAndStop(last, true);
    }
  }, [reduceMotion]);

  const fadeMs = reduceMotion ? 80 : 480;

  if (loadError) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-[2] select-none"
      aria-hidden={!visible}
      style={{
        top: "50%",
        left: "calc(clamp(220px, min(34vw, 420px), 480px) - 245px)",
        width: "min(1153px, 111vw)",
        maxWidth: "100%",
        transform: visible
          ? `translateY(-50%) rotate(-8deg) scale(${LOTTIE_DISPLAY_SCALE})`
          : `translateY(calc(-50% + 12px)) rotate(-8deg) scale(${LOTTIE_DISPLAY_SCALE * 0.97})`,
        transformOrigin: "center center",
        opacity: visible && animationData ? 1 : 0,
        transition: reduceMotion
          ? "none"
          : `opacity ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${fadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      {animationData ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          className="h-auto w-full"
        />
      ) : null}
    </div>
  );
}
