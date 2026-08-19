"use client";

import { useEffect, useState } from "react";

const COARSE_MQ = "(pointer: coarse)";

/** True on touch-primary devices (iPad, phones) even in landscape desktop layout. */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(COARSE_MQ);
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return coarse;
}

export function readCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(COARSE_MQ).matches;
}
