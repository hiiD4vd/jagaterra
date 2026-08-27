'use client';

import { motion, type Variants } from 'framer-motion';
import { SPRING } from '@/lib/motion';

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    // long + soft — motion should read calm and expensive, never snappy
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Hero overlay (bottom-left). Framer staggers it in once the frames are ready
 * (`play`); its exit on scroll is scrubbed by GSAP on the parent wrapper in
 * ScrollSequence, so the two libraries never animate the same node.
 */
export default function HeroCopy({ play }: { play: boolean }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate={play ? 'show' : 'hidden'}
      className="flex h-full flex-col items-center justify-end px-6 pb-28 text-center [text-shadow:0_2px_24px_rgba(13,9,6,0.55)] md:items-start md:p-16 md:pb-32 md:text-left"
    >
      <motion.h1
        variants={item}
        className="max-w-3xl font-display text-display text-bone"
      >
        Daging Sapi Premium,{' '}
        <em className="text-meat [text-shadow:0_2px_18px_rgba(13,9,6,0.85)]">
          Grass-Fed
        </em>{' '}
        Australia
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-6 max-w-xl text-sm font-medium leading-relaxed tracking-normal text-bone [text-shadow:0_2px_18px_rgba(13,9,6,0.85)] md:text-base"
      >
        grass-fed finished, bebas dari antibiotics dan growth hormone, pakan rumput alami yang bebas dari pestisida dan air dari sumber air pegunungan Goulburn valley-Australia
      </motion.p>

      <motion.div variants={item} className="mt-8">
        <motion.a
          href="#galeri"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          className="inline-flex min-h-12 items-center rounded-full bg-burgundy px-7 text-sm font-semibold text-bone shadow-lg ring-1 ring-bone/15"
        >
          Jelajahi Potongan
        </motion.a>
      </motion.div>
    </motion.div>
  );
}
