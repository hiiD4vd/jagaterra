'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { waLink } from '@/lib/site';
import { SPRING } from '@/lib/motion';

/**
 * Absolute (not fixed) on purpose: it scrolls away with the hero, so it can
 * never collide with the pinned gallery or fight ScrollTrigger's pin-spacers.
 * Every target ≥44px tall (min-h-11 = 44px).
 */
export default function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-4 md:px-10 md:py-5">
      <a href="#" aria-label="Jagaterra beranda" className="block">
        <Image
          src="/logo.png"
          alt="Jagaterra, Daging Sapi Grass-Fed Segar"
          width={226}
          height={320}
          priority
          className="h-[5.5rem] w-auto object-contain drop-shadow-[0_2px_12px_rgba(13,9,6,0.55)] md:h-28"
        />
      </a>

      <nav aria-label="Utama" className="flex items-center gap-1 md:gap-3">
        <a
          href="#galeri"
          className="inline-flex min-h-11 items-center px-3 text-xs font-medium uppercase tracking-[0.22em] text-bone/80 transition-colors hover:text-meat"
        >
          Koleksi
        </a>
        <motion.a
          href={waLink('Halo Jagaterra, saya mau pesan daging.')}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          className="inline-flex min-h-11 items-center rounded-full bg-burgundy px-5 text-xs font-semibold uppercase tracking-[0.18em] text-bone shadow-lg ring-1 ring-bone/15"
        >
          Pesan
        </motion.a>
      </nav>
    </header>
  );
}
