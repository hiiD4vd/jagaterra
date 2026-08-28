'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

const STATS = [
  { value: 30, suffix: '', label: 'Bulan Pemeliharaan' },
  { value: 100, suffix: '%', label: 'Grass-fed' },
  { value: 3, suffix: '', label: 'Jam ke Rumah Anda' },
];

function Stat({
  value,
  suffix,
  label,
  active,
  instant,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  instant: boolean;
}) {
  const [shown, setShown] = useState(instant ? value : 0);
  const startedRef = useRef(false);

  // Count-up runs once, the first time the scrubbed overlay reaches mid-scroll
  // (`active` comes from ScrollTrigger progress in ScrollSequence). In the
  // reduced-motion/static variant, `instant` renders the final value directly.
  useEffect(() => {
    if (instant) {
      setShown(value);
      return;
    }
    if (!active || startedRef.current) return;
    startedRef.current = true;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [active, instant, value]);

  return (
    <div>
      <p className="font-display text-4xl text-bone tabular-nums md:text-5xl">
        {shown}
        {suffix && <span className="ml-0.5 text-2xl text-meat md:text-3xl">{suffix}</span>}
      </p>
      <p className="mt-2 text-label uppercase tracking-[0.22em] text-bone/80">{label}</p>
    </div>
  );
}

/**
 * Section-2 copy ("Standar Kami").
 * variant="overlay": floats over the canvas, right-aligned on md+ (left on
 * mobile); its fade in/out is scrubbed by GSAP on the parent element.
 * variant="static": plain block used on the prefers-reduced-motion path.
 */
export default function SectionTwoCopy({
  countersOn,
  variant,
}: {
  countersOn: boolean;
  variant: 'overlay' | 'static';
}) {
  const isOverlay = variant === 'overlay';

  return (
    <div
      className={
        isOverlay
          ? 'flex h-full flex-col items-center justify-center px-6 text-center [text-shadow:0_2px_20px_rgba(13,9,6,0.75)] md:items-center md:p-16 md:text-center'
          : 'mx-auto flex max-w-4xl flex-col items-start px-6 py-28 text-left'
      }
    >
      <p className="mb-4 text-base font-semibold uppercase tracking-[0.3em] text-meat md:text-xl">
        Standar Kami
      </p>

      <h2 className="max-w-2xl font-display text-h3 text-bone">
        100% grass fed finished, di ternak secara alami dengan teknik regenerative farming tanpa rekayasa genetika.
      </h2>

      {/* Counters are hidden on mobile — the small screen keeps only the
          eyebrow and headline (see request). They return at md+. */}

      <div className={`mt-11 hidden flex-wrap gap-x-12 gap-y-7 md:flex ${isOverlay ? 'md:justify-center' : ''}`}>
        {STATS.map((s) => (
          <Stat key={s.label} {...s} active={countersOn} instant={!isOverlay} />
        ))}
      </div>
    </div>
  );
}
