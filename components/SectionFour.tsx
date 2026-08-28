'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';

const CARDS = [
  {
    id: 'rumput',
    badge: '100% Hay & Pasture',
    title: 'Rumput Alami',
    body: 'Rumput segar & hay dari padang alami — bebas pestisida, bebas GMO. Makanan yang sesuai kodratnya.',
  },
  {
    id: 'no-hormon',
    badge: 'Zero Growth Hormone',
    title: 'Tanpa Hormon',
    body: 'Tidak dipaksa besar cepat dengan suntikan hormon. Tumbuh 24–30 bulan secara wajar dan natural.',
  },
  {
    id: 'omega',
    badge: 'Nutrisi Superior',
    title: 'Omega-3 Tinggi',
    body: 'Hasilnya: daging dengan Omega-3 jauh lebih tinggi, CLA natural, dan rasa yang lebih kaya.',
    counter: { value: 300, suffix: '%', label: 'Omega-3 vs Grain-Fed' },
  },
];

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

function Card({
  card,
  isActive,
}: {
  card: (typeof CARDS)[0];
  isActive: boolean;
}) {
  const [counterValue, setCounterValue] = useState(0);
  const hasAnimated = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: true, amount: 0.6 });

  useEffect(() => {
    if (cardInView && card.counter && !hasAnimated.current) {
      hasAnimated.current = true;
      const controls = animate(0, card.counter.value, {
        duration: 1.6,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => setCounterValue(Math.round(v)),
      });
      return () => controls.stop();
    }
  }, [cardInView, card.counter]);

  return (
    <div
      ref={cardRef}
      className={`flex h-full min-w-[82vw] snap-center flex-col justify-between rounded-2xl bg-bone p-8 shadow-[0_24px_60px_-24px_rgba(13,9,6,0.55)] transition-all duration-700 md:min-w-[400px] md:p-10 ${
        isActive
          ? 'scale-[1.03] ring-2 ring-bone/60'
          : 'scale-100 opacity-80 ring-1 ring-bone/25'
      }`}
    >
      <div>
        <span className="inline-block rounded-full bg-burgundy px-4 py-1.5 text-label font-semibold uppercase tracking-widest text-bone">
          {card.badge}
        </span>

        <h3 className="mt-6 font-display text-h3 text-ink">{card.title}</h3>

        <p className="mt-4 max-w-sm text-base leading-relaxed text-ink/70">{card.body}</p>
      </div>

      {card.counter && (
        <div className="mt-8">
          <p className="font-display text-5xl tabular-nums text-burgundy md:text-6xl">
            {counterValue}
            <span className="ml-1 text-3xl text-ember">{card.counter.suffix}</span>
          </p>
          <p className="mt-2 text-label uppercase tracking-[0.22em] text-ink/60">
            {card.counter.label}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Section 4: "Yang Mereka Makan" (Diet = Kualitas)
 * Latar burgundy (merah brand) — kartu cream.
 * Horizontal scroll snap, kartu aktif scale+ring, counter Omega-3.
 */
export default function SectionFour() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardWidth = container.scrollWidth / CARDS.length;
      const idx = Math.round(container.scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(idx, 0), CARDS.length - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (i: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.scrollWidth / CARDS.length;
    container.scrollTo({ left: cardWidth * i, behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-burgundy py-24 md:py-32"
    >
      {/* Tekstur halus: lingkaran cahaya besar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-[#8a1a12]/40 blur-3xl"
      />

      {/* Header */}
      <div
        className="relative mx-auto mb-14 max-w-3xl px-6 text-center"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(40px)',
          transition: `opacity 1s ${EASE}, transform 1s ${EASE}`,
        }}
      >
        <p className="text-label font-semibold uppercase tracking-[0.3em] text-bone/70">
          Yang Mereka Makan
        </p>
        <h2 className="mt-5 font-display text-h2 text-bone">
          Hanya Rumput. Tidak Ada Yang Lain.
        </h2>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory items-stretch gap-6 overflow-x-auto px-6 pb-8 md:gap-8 md:px-12"
        style={{
          opacity: isInView ? 1 : 0,
          transition: `opacity 1.2s ${EASE} 0.2s`,
        }}
      >
        {CARDS.map((card, i) => (
          <Card key={card.id} card={card} isActive={activeIndex === i} />
        ))}
      </div>

      {/* Dots */}
      <div className="relative mt-8 flex justify-center gap-2.5">
        {CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeIndex === i ? 'w-10 bg-bone' : 'w-2 bg-bone/40 hover:bg-bone/70'
            }`}
            aria-label={`Kartu ${i + 1}`}
          />
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
