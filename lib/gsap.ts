'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Single registration point — every component imports gsap from here so the
// plugin is registered exactly once, and only in the browser (GSAP plugins
// touch `window` at registration time).
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  if (process.env.NODE_ENV === 'development') {
    // handy for debugging scrub/pin issues from the console
    (window as unknown as Record<string, unknown>).__ST = ScrollTrigger;
    (window as unknown as Record<string, unknown>).__GSAP = gsap;
  }
}

export { gsap, ScrollTrigger, useGSAP };
