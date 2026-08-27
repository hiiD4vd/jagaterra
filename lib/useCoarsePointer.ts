'use client';

import { useEffect, useState } from 'react';

/**
 * Touch / small-screen detection for picking the scrub surface.
 *
 * Returns `null` until measured on mount (SSR and the first client paint agree,
 * and no scrub surface starts downloading before the device is known), then
 * true on touch/small-screen devices, false on fine-pointer desktops.
 *
 * Why it matters: iOS Safari won't decode/paint seeked frames on a *paused*
 * inline <video>, so scroll-scrubbing by currentTime is desktop-only —
 * touch devices scrub a preloaded image sequence on <canvas> instead.
 * The `max-width` clause lets a narrow desktop viewport reproduce the mobile
 * path for testing.
 */
export function useCoarsePointer(): boolean | null {
  const [coarse, setCoarse] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse), (max-width: 767px)');
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return coarse;
}
