// Shared Framer Motion vocabulary — one ease, one spring, three duration tiers.
// Every NEW interaction animation draws from here so the whole page shares a
// single rhythm. (GSAP scroll work has its own pacing — scroll is the clock.)

/** House ease — soft, expensive-feeling decel. Same curve the hero stagger uses. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Spring for anything the user directly manipulates (press, drag, hover-lift). */
export const SPRING = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 } as const;

/** Duration tiers (seconds): micro-interactions / standard transitions / large surfaces. */
export const DUR = { micro: 0.15, standard: 0.25, surface: 0.4 } as const;
