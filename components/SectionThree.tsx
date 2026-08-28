'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';

const POINTS = [
  {
    no: '01',
    title: 'Padang Rumput Luas',
    detail: 'Free range 5 hektar per ekor — bergerak bebas, tanpa kandang sempit.',
  },
  {
    no: '02',
    title: 'Udara Sejuk Pegunungan',
    detail: 'Dibesarkan di Goulburn Valley, Australia — udara sejuk, hidup sehat.',
  },
  {
    no: '03',
    title: 'Tumbuh Tanpa Paksaan',
    detail: 'Dewasa secara wajar dan natural, tidak dipacu tumbuh cepat.',
  },
];

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Section 3: "Kehidupan Mereka" (Free Range Story)
 * Latar cream (bone) — tema gelap hanya untuk banner sequence.
 * Split: video kiri, teks scroll-reveal kanan.
 */
export default function SectionThree() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.25 });

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-burgundy px-6 py-24 text-bone md:flex-row md:px-12 md:py-32"
    >
      {/* Ornamen brand halus */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-meat/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-ink/20 blur-3xl"
      />

      {/* Left: Video */}
      <div
        className="relative order-1 h-[46vh] w-full overflow-hidden rounded-2xl shadow-[0_32px_80px_-32px_rgba(29,20,15,0.45)] ring-1 ring-bone/20 md:h-[72vh] md:w-[46%]"
        style={{
          transform: isInView ? 'scale(1)' : 'scale(0.96)',
          opacity: isInView ? 1 : 0,
          transition: `transform 1.4s ${EASE}, opacity 1.4s ${EASE}`,
        }}
      >
        <video
          id="free-range-video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>
        {/* Frame caption */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink/70 to-transparent p-5">
          <p className="text-label font-semibold uppercase tracking-[0.22em] text-bone">
            Padang Goulburn Valley
          </p>
          <p className="text-label font-semibold tabular-nums text-bone/80">Free Range</p>
        </div>
      </div>

      {/* Right: Text Content */}
      <div
        className="order-2 mt-12 flex w-full flex-col items-start md:mt-0 md:w-[54%] md:pl-16"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(48px)',
          transition: `opacity 1.1s ${EASE} 0.15s, transform 1.1s ${EASE} 0.15s`,
        }}
      >
        <p className="text-label font-semibold uppercase tracking-[0.3em] text-meat">
          Kehidupan Mereka
        </p>

        <h2 className="mt-5 max-w-xl font-display text-h2 leading-tight text-bone">
          Sapi Kami Hidup Seperti Seharusnya
        </h2>

        <p className="mt-6 max-w-lg text-base leading-relaxed text-bone/75 md:text-lg">
          Tidak terkurung. Tidak stress. Dibesarkan bebas di padang rumput seluas 5 hektar per ekor
          di Goulburn Valley, Australia — dari lahir hingga dewasa secara alami.
        </p>

        {/* Three Points */}
        <div className="mt-10 w-full divide-y divide-bone/20 border-y border-bone/20">
          {POINTS.map((point, i) => (
            <div
              key={point.title}
              className="group flex items-start gap-6 py-6 transition-colors duration-500 hover:bg-bone/10"
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity 0.9s ${EASE} ${0.35 + i * 0.15}s, transform 0.9s ${EASE} ${0.35 + i * 0.15}s`,
              }}
            >
              <span className="font-display text-2xl tabular-nums text-meat/80 transition-colors duration-500 group-hover:text-meat md:text-3xl">
                {point.no}
              </span>
              <div>
                <h3 className="font-display text-lg text-bone md:text-xl">{point.title}</h3>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-bone/70 md:text-base">
                  {point.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
