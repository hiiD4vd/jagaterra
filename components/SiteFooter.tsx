'use client';

import { motion, type Variants } from 'framer-motion';
import { waLink } from '@/lib/site';
import { EASE_OUT } from '@/lib/motion';

const column: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE_OUT },
  },
};

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

// Every link goes somewhere real: the gallery anchor, or WhatsApp with a
// prefilled message matching the label — the reader lands mid-conversation.
const LINKS: { heading: string; items: { label: string; href: string; external?: boolean }[] }[] = [
  {
    heading: 'Belanja',
    items: [
      { label: 'Semua Potongan', href: '#galeri' },
      { label: 'Steak & Grill', href: waLink('Halo Jagaterra, saya mau pesan potongan steak & grill.'), external: true },
      { label: 'Slice & Shabu', href: waLink('Halo Jagaterra, saya mau pesan potongan slice & shabu.'), external: true },
    ],
  },
  {
    heading: 'Bantuan',
    items: [
      { label: 'Chat WhatsApp', href: waLink('Halo Jagaterra!'), external: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-burgundy text-bone">
      <motion.div
        variants={grid}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[2fr_1fr_1fr] md:px-10"
      >
        <motion.div variants={column}>
          <p className="font-display text-3xl tracking-[0.14em]">Jagaterra</p>
          <p className="mt-2 text-label font-semibold uppercase text-bone/85">
            Daging Sapi Grass-Fed Premium
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/70">
            Daging sapi grass-fed premium Australia, dibesarkan secara alami
            tanpa hormon dan antibiotik. Pakan rumput alami bebas pestisida,
            air dari sumber pegunungan Goulburn Valley. Rantai dingin terjaga.
          </p>
        </motion.div>

        {LINKS.map((col) => (
          <motion.nav key={col.heading} variants={column} aria-label={col.heading}>
            <h4 className="mb-5 text-label font-semibold uppercase text-bone">
              {col.heading}
            </h4>
            <ul className="space-y-1 text-sm text-bone/75">
              {col.items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-flex min-h-9 items-center transition-colors hover:text-bone"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        ))}
      </motion.div>

      <div className="border-t border-bone/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-bone/65 sm:flex-row sm:items-center sm:justify-between md:px-10">
          <p>© 2026 Jagaterra, Jakarta</p>
          <p>Halal · Rantai Dingin · Same-day</p>
        </div>
      </div>
    </footer>
  );
}
