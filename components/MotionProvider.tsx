'use client';

import { MotionConfig } from 'framer-motion';

/**
 * App-wide Framer Motion config: `reducedMotion="user"` makes every motion.*
 * component honor prefers-reduced-motion automatically (transform animations
 * are dropped, opacity still fades). GSAP's side is handled separately in the
 * components via usePrefersReducedMotion.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
